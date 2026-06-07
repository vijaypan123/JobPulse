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

export function storeOAuthSession(state: string, verifier: string): void {
  sessionStorage.setItem("jobpulse_oauth_state", state);
  sessionStorage.setItem("jobpulse_oauth_verifier", verifier);
}

export function readOAuthSession(): { state: string; verifier: string } | null {
  const state = sessionStorage.getItem("jobpulse_oauth_state");
  const verifier = sessionStorage.getItem("jobpulse_oauth_verifier");

  if (!state || !verifier) {
    return null;
  }

  return { state, verifier };
}

export function clearOAuthSession(): void {
  sessionStorage.removeItem("jobpulse_oauth_state");
  sessionStorage.removeItem("jobpulse_oauth_verifier");
}
