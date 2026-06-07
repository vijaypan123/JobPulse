import type { GmailAuthMode } from "./config";

export type GmailAuthState = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  email?: string;
  connectedAt: string;
  authMode?: GmailAuthMode;
  clientId?: string;
};

export type GmailTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

export type GmailMessageHeader = {
  name: string;
  value: string;
};

export type GmailMessageListResponse = {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
};

export type GmailMessageResponse = {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  payload?: {
    headers?: GmailMessageHeader[];
  };
};

export type GmailProfileResponse = {
  emailAddress: string;
  messagesTotal?: number;
  threadsTotal?: number;
  historyId?: string;
};

export type ParsedGmailMessage = {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  receivedAt: string;
};

export type GmailImportSummary = {
  fetched: number;
  processed: number;
  skipped: number;
  applicationsUpdated: number;
  alertsCreated: number;
  errors: string[];
};
