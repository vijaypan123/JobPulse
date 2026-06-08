import { GMAIL_API_BASE, GMAIL_IMPORT_MAX_RESULTS, JOB_SEARCH_QUERY } from "./config";
import type {
  GmailMessageListResponse,
  GmailMessageResponse,
  GmailProfileResponse,
  ParsedGmailMessage,
} from "./types";

function getHeader(headers: { name: string; value: string }[] | undefined, name: string): string {
  return headers?.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

export async function fetchGmailProfile(accessToken: string): Promise<GmailProfileResponse> {
  return gmailRequest<GmailProfileResponse>("/users/me/profile", accessToken);
}

export async function searchJobRelatedMessages(
  accessToken: string,
  maxResults = GMAIL_IMPORT_MAX_RESULTS,
): Promise<string[]> {
  const messageIds: string[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: JOB_SEARCH_QUERY,
      maxResults: String(Math.min(maxResults - messageIds.length, 100)),
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await gmailRequest<GmailMessageListResponse>(
      `/users/me/messages?${params.toString()}`,
      accessToken,
    );

    for (const message of response.messages ?? []) {
      messageIds.push(message.id);
    }

    pageToken = response.nextPageToken;
  } while (pageToken && messageIds.length < maxResults);

  return messageIds;
}

export async function fetchGmailMessage(
  accessToken: string,
  messageId: string,
): Promise<ParsedGmailMessage> {
  const params = new URLSearchParams({
    format: "metadata",
  });
  params.append("metadataHeaders", "From");
  params.append("metadataHeaders", "Subject");
  params.append("metadataHeaders", "Date");

  const message = await gmailRequest<GmailMessageResponse>(
    `/users/me/messages/${messageId}?${params.toString()}`,
    accessToken,
  );

  const from = getHeader(message.payload?.headers, "From");
  const subject = getHeader(message.payload?.headers, "Subject");
  const headerDate = getHeader(message.payload?.headers, "Date");
  const receivedAt = message.internalDate
    ? new Date(Number(message.internalDate)).toISOString()
    : headerDate
      ? new Date(headerDate).toISOString()
      : new Date().toISOString();

  return {
    id: message.id,
    from,
    subject,
    snippet: message.snippet ?? "",
    receivedAt,
  };
}

async function gmailRequest<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${GMAIL_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gmail API request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as T;
}
