export type GmailAuthMode = "builtin" | "custom";

export const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";
export const GOOGLE_GSI_SCRIPT = "https://accounts.google.com/gsi/client";

export const GMAIL_AUTH_SETTING_KEY = "gmail_auth";
export const GMAIL_LAST_SYNC_SETTING_KEY = "gmail_last_sync_at";
export const OAUTH_STATE_STORAGE_KEY = "jobpulse_oauth_state";
export const OAUTH_VERIFIER_STORAGE_KEY = "jobpulse_oauth_verifier";
export const OAUTH_MODE_STORAGE_KEY = "jobpulse_oauth_mode";

export const GMAIL_SYNC_INTERVAL_MS = 20 * 60 * 1000;

export const GMAIL_IMPORT_MAX_RESULTS = 100;

export const JOB_SEARCH_QUERY = [
  "newer_than:30d (",
  "subject:interview OR",
  "subject:application OR",
  "subject:assessment OR",
  "subject:offer OR",
  "subject:recruiter OR",
  "subject:candidacy OR",
  "subject:candidate OR",
  "subject:hiring OR",
  "subject:screening OR",
  "subject:\"next steps\" OR",
  "subject:\"thank you for applying\" OR",
  "subject:\"application received\" OR",
  "subject:\"application update\" OR",
  "subject:\"your application\" OR",
  "subject:unfortunately OR",
  "subject:congratulations OR",
  "from:(greenhouse.io OR lever.co OR workday.com OR icims.com OR smartrecruiters.com OR ashbyhq.com OR jobvite.com OR myworkdayjobs.com) OR",
  "\"thank you for applying\" OR",
  "\"application received\" OR",
  "\"schedule your interview\" OR",
  "\"online assessment\" OR",
  "\"not selected\" OR",
  "\"moving forward with other candidates\"",
  ")",
].join(" ");

const PLACEHOLDER_CLIENT_ID = "your-client-id.apps.googleusercontent.com";

function normalizeClientId(value: string | undefined): string | null {
  const clientId = value?.trim();
  if (!clientId || clientId === PLACEHOLDER_CLIENT_ID) {
    return null;
  }

  return clientId;
}

/** User-owned OAuth app from `.env` — full control over their Google Cloud project. */
export function getUserClientId(): string | null {
  return normalizeClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID);
}

/** Shared JobPulse OAuth app for one-click Sign in with Google (set by app maintainer). */
export function getBuiltinClientId(): string | null {
  return normalizeClientId(import.meta.env.VITE_BUILTIN_GOOGLE_CLIENT_ID);
}

export function getClientIdForMode(mode: GmailAuthMode): string | null {
  return mode === "custom" ? getUserClientId() : getBuiltinClientId();
}

/** @deprecated Use getUserClientId or getClientIdForMode */
export function getGoogleClientId(): string | null {
  return getUserClientId() ?? getBuiltinClientId();
}

export function isCustomGmailConfigured(): boolean {
  return getUserClientId() !== null;
}

export function isBuiltinGmailConfigured(): boolean {
  return getBuiltinClientId() !== null;
}

export function isGmailConfigured(): boolean {
  return isCustomGmailConfigured() || isBuiltinGmailConfigured();
}

export function getOAuthRedirectUri(): string {
  return `${window.location.origin}/oauth/google/callback`;
}
