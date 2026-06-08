import type { GmailAuthMode } from "./config";
import {
  getClientIdForMode,
  getOAuthRedirectUri,
  getUserClientId,
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

function resolveClientIdForAuthState(authState: GmailAuthState | null): string | null {
  if (authState?.clientId) {
    return authState.clientId;
  }

  if (authState?.authMode) {
    return getClientIdForMode(authState.authMode);
  }

  return getUserClientId();
}

export async function startGmailOAuth(mode: GmailAuthMode): Promise<void> {
  const clientId = getClientIdForMode(mode);
  if (!clientId) {
    if (mode === "custom") {
      throw new Error(
        "Your own Google OAuth client ID is not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.",
      );
    }

    throw new Error(
      "Built-in Sign in with Google is not configured for this build. Ask the app maintainer to set VITE_BUILTIN_GOOGLE_CLIENT_ID.",
    );
  }

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateOAuthState();
  storeOAuthSession(state, verifier, mode);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getOAuthRedirectUri(),
    response_type: "code",
    scope: GMAIL_READONLY_SCOPE,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
    access_type: "offline",
    prompt: "select_account consent",
    include_granted_scopes: "true",
  });

  window.location.assign(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}

export async function completeGmailOAuth(code: string, state: string): Promise<GmailAuthState> {
  const session = readOAuthSession();
  if (!session || session.state !== state) {
    throw new Error("OAuth state mismatch. Please try connecting Gmail again.");
  }

  const clientId = getClientIdForMode(session.mode);
  if (!clientId) {
    throw new Error("Google OAuth client ID is not configured for this connection mode.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    code,
    code_verifier: session.verifier,
    grant_type: "authorization_code",
    redirect_uri: getOAuthRedirectUri(),
  });

  const tokenResponse = await exchangeAuthCode(body);
  const authState = await buildAuthState(tokenResponse, undefined, undefined, {
    authMode: session.mode,
    clientId,
  });

  await saveGmailAuthState(authState);
  clearOAuthSession();
  return authState;
}

export async function completeGmailOAuthPopup(
  code: string,
  clientId: string,
): Promise<GmailAuthState> {
  const body = new URLSearchParams({
    client_id: clientId,
    code,
    grant_type: "authorization_code",
    redirect_uri: "postmessage",
  });

  const tokenResponse = await exchangeAuthCode(body);
  const authState = await buildAuthState(tokenResponse, undefined, undefined, {
    authMode: "builtin",
    clientId,
  });

  await saveGmailAuthState(authState);
  return authState;
}

function formatOAuthError(errorText: string): string {
  if (errorText.includes("client_secret is missing")) {
    return (
      "Could not complete Gmail OAuth: Google requires a client secret for Web application OAuth clients. " +
      "Add GOOGLE_CLIENT_SECRET to your .env file (from Google Cloud → Credentials → your OAuth client), " +
      "restart npm run dev, and try again. Or recreate the OAuth client as type Desktop app instead."
    );
  }

  return `Could not complete Gmail OAuth: ${errorText}`;
}

async function exchangeAuthCode(body: URLSearchParams): Promise<GmailTokenResponse> {
  const tokenEndpoint =
    import.meta.env.DEV && typeof window !== "undefined"
      ? "/api/gmail/oauth/token"
      : GOOGLE_TOKEN_URL;

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(formatOAuthError(errorText));
  }

  return (await response.json()) as GmailTokenResponse;
}

export async function refreshGmailAccessToken(
  refreshToken: string,
  authState?: GmailAuthState | null,
): Promise<GmailAuthState> {
  const clientId = resolveClientIdForAuthState(authState ?? null);
  if (!clientId) {
    throw new Error("Google OAuth client ID is not configured.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const tokenResponse = await exchangeAuthCode(body);
  const existing = authState ?? (await loadGmailAuthState());
  const refreshed = await buildAuthState(
    tokenResponse,
    existing?.refreshToken ?? refreshToken,
    existing,
    {
      authMode: existing?.authMode ?? "custom",
      clientId: existing?.clientId ?? clientId,
    },
  );

  await saveGmailAuthState(refreshed);
  return refreshed;
}

async function buildAuthState(
  tokenResponse: GmailTokenResponse,
  refreshToken?: string,
  existing?: GmailAuthState | null,
  meta?: Pick<GmailAuthState, "authMode" | "clientId">,
): Promise<GmailAuthState> {
  const authState: GmailAuthState = {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token ?? refreshToken ?? existing?.refreshToken,
    expiresAt: Date.now() + tokenResponse.expires_in * 1000 - 60_000,
    email: existing?.email,
    connectedAt: existing?.connectedAt ?? new Date().toISOString(),
    authMode: meta?.authMode ?? existing?.authMode,
    clientId: meta?.clientId ?? existing?.clientId,
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

  const refreshed = await refreshGmailAccessToken(authState.refreshToken, authState);
  return refreshed.accessToken;
}

export async function isGmailConnected(): Promise<boolean> {
  const authState = await loadGmailAuthState();
  return Boolean(authState?.accessToken);
}
