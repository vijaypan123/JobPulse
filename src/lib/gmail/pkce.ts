import type { GmailAuthMode } from "./config";
import { OAUTH_MODE_STORAGE_KEY, OAUTH_STATE_STORAGE_KEY, OAUTH_VERIFIER_STORAGE_KEY } from "./config";

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

export function generateOAuthState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export function storeOAuthSession(state: string, verifier: string, mode: GmailAuthMode): void {
  sessionStorage.setItem(OAUTH_STATE_STORAGE_KEY, state);
  sessionStorage.setItem(OAUTH_VERIFIER_STORAGE_KEY, verifier);
  sessionStorage.setItem(OAUTH_MODE_STORAGE_KEY, mode);
}

export function readOAuthSession(): { state: string; verifier: string; mode: GmailAuthMode } | null {
  const state = sessionStorage.getItem(OAUTH_STATE_STORAGE_KEY);
  const verifier = sessionStorage.getItem(OAUTH_VERIFIER_STORAGE_KEY);
  const mode = sessionStorage.getItem(OAUTH_MODE_STORAGE_KEY) as GmailAuthMode | null;

  if (!state || !verifier || (mode !== "builtin" && mode !== "custom")) {
    return null;
  }

  return { state, verifier, mode };
}

export function clearOAuthSession(): void {
  sessionStorage.removeItem(OAUTH_STATE_STORAGE_KEY);
  sessionStorage.removeItem(OAUTH_VERIFIER_STORAGE_KEY);
  sessionStorage.removeItem(OAUTH_MODE_STORAGE_KEY);
}
