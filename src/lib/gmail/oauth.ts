import {
  getGoogleClientId,
  getOAuthRedirectUri,
  GMAIL_AUTH_SETTING_KEY,
  GMAIL_LAST_SYNC_SETTING_KEY,
  GMAIL_READONLY_SCOPE,
  GOOGLE_AUTH_URL,
  GOOGLE_TOKEN_URL,
} from "./config";
import {
  clearOAuthSession,
  generateCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
  readOAuthSession,
  storeOAuthSession,
} from "./pkce";
import type { GmailAuthState, GmailTokenResponse } from "./types";
import { deleteSetting, getSetting, setSetting } from "../db";
import { fetchGmailProfile } from "./api";

export async function startGmailOAuth(): Promise<void> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error(
      "Google OAuth client ID is not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.",
    );
  }

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateOAuthState();
  storeOAuthSession(state, verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getOAuthRedirectUri(),
    response_type: "code",
    scope: GMAIL_READONLY_SCOPE,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });

  window.location.assign(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}

export async function completeGmailOAuth(code: string, state: string): Promise<GmailAuthState> {
  const session = readOAuthSession();
  if (!session || session.state !== state) {
    throw new Error("OAuth state mismatch. Please try connecting Gmail again.");
  }

  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("Google OAuth client ID is not configured.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    code,
    code_verifier: session.verifier,
    grant_type: "authorization_code",
    redirect_uri: getOAuthRedirectUri(),
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Could not complete Gmail OAuth: ${errorText}`);
  }

  const tokenResponse = (await response.json()) as GmailTokenResponse;
  const authState = await buildAuthState(tokenResponse);
  await saveGmailAuthState(authState);
  clearOAuthSession();
  return authState;
}

export async function refreshGmailAccessToken(
  refreshToken: string,
): Promise<GmailAuthState> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("Google OAuth client ID is not configured.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Could not refresh Gmail access token: ${errorText}`);
  }

  const tokenResponse = (await response.json()) as GmailTokenResponse;
  const existing = await loadGmailAuthState();
  const authState = await buildAuthState(tokenResponse, existing?.refreshToken ?? refreshToken, existing);
  await saveGmailAuthState(authState);
  return authState;
}

async function buildAuthState(
  tokenResponse: GmailTokenResponse,
  refreshToken?: string,
  existing?: GmailAuthState | null,
): Promise<GmailAuthState> {
  const authState: GmailAuthState = {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token ?? refreshToken ?? existing?.refreshToken,
    expiresAt: Date.now() + tokenResponse.expires_in * 1000 - 60_000,
    email: existing?.email,
    connectedAt: existing?.connectedAt ?? new Date().toISOString(),
  };

  try {
    const profile = await fetchGmailProfile(authState.accessToken);
    authState.email = profile.emailAddress;
  } catch {
    authState.email = existing?.email;
  }

  return authState;
}

export async function saveGmailAuthState(authState: GmailAuthState): Promise<void> {
  await setSetting(GMAIL_AUTH_SETTING_KEY, JSON.stringify(authState));
}

export async function loadGmailAuthState(): Promise<GmailAuthState | null> {
  const raw = await getSetting(GMAIL_AUTH_SETTING_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as GmailAuthState;
  } catch {
    return null;
  }
}

export async function disconnectGmail(): Promise<void> {
  await deleteSetting(GMAIL_AUTH_SETTING_KEY);
  await deleteSetting(GMAIL_LAST_SYNC_SETTING_KEY);
  clearOAuthSession();
}

export async function getValidGmailAccessToken(): Promise<string> {
  const authState = await loadGmailAuthState();
  if (!authState) {
    throw new Error("Gmail is not connected.");
  }

  if (Date.now() < authState.expiresAt) {
    return authState.accessToken;
  }

  if (!authState.refreshToken) {
    throw new Error("Gmail session expired. Please connect Gmail again.");
  }

  const refreshed = await refreshGmailAccessToken(authState.refreshToken);
  return refreshed.accessToken;
}

export async function isGmailConnected(): Promise<boolean> {
  const authState = await loadGmailAuthState();
  return Boolean(authState?.accessToken);
}
