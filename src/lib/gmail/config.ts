export const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";

export const GMAIL_AUTH_SETTING_KEY = "gmail_auth";
export const GMAIL_LAST_SYNC_SETTING_KEY = "gmail_last_sync_at";
export const OAUTH_STATE_STORAGE_KEY = "jobpulse_oauth_state";
export const OAUTH_VERIFIER_STORAGE_KEY = "jobpulse_oauth_verifier";

export const GMAIL_SYNC_INTERVAL_MS = 20 * 60 * 1000;

export const JOB_SEARCH_QUERY = [
  "newer_than:14d (",
  "subject:interview OR",
  "subject:application OR",
  "subject:assessment OR",
  "subject:offer OR",
  "subject:recruiter OR",
  "subject:\"next steps\" OR",
  "subject:\"thank you for applying\" OR",
  "subject:unfortunately OR",
  "subject:congratulations",
  ")",
].join(" ");

export function getGoogleClientId(): string | null {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (!clientId || clientId === "your-client-id.apps.googleusercontent.com") {
    return null;
  }

  return clientId;
}

export function getOAuthRedirectUri(): string {
  return `${window.location.origin}/oauth/google/callback`;
}

export function isGmailConfigured(): boolean {
  return getGoogleClientId() !== null;
}
