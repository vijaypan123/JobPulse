export type { GmailAuthMode } from "./config";
export {
  getGoogleClientId,
  getUserClientId,
  getBuiltinClientId,
  getOAuthRedirectUri,
  isGmailConfigured,
  isCustomGmailConfigured,
  isBuiltinGmailConfigured,
  GMAIL_SYNC_INTERVAL_MS,
} from "./config";
export {
  startGmailOAuth,
  completeGmailOAuth,
  completeGmailOAuthPopup,
  disconnectGmail,
  isGmailConnected,
  loadGmailAuthState,
} from "./oauth";
export { importGmailMessages } from "./import";
export type { GmailAuthState, GmailImportSummary } from "./types";
