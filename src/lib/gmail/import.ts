import { isMessageProcessed, setSetting } from "../db";
import { processClassifierEmail, reconcileApplicationStatusesFromEmails } from "../processEmail";
import type { ClassifierEmailInput } from "../classifier/types";
import { fetchGmailMessage, searchJobRelatedMessages } from "./api";
import { GMAIL_LAST_SYNC_SETTING_KEY } from "./config";
import { getValidGmailAccessToken } from "./oauth";
import type { GmailImportSummary, ParsedGmailMessage } from "./types";

export async function importGmailMessages(): Promise<GmailImportSummary> {
  const accessToken = await getValidGmailAccessToken();
  const messageIds = await searchJobRelatedMessages(accessToken);

  const summary: GmailImportSummary = {
    fetched: messageIds.length,
    processed: 0,
    skipped: 0,
    applicationsUpdated: 0,
    alertsCreated: 0,
    errors: [],
  };

  for (const messageId of messageIds) {
    try {
      if (await isMessageProcessed(messageId)) {
        summary.skipped += 1;
        continue;
      }

      const message = await fetchGmailMessage(accessToken, messageId);
      const result = await processGmailMessage(message);
      summary.processed += 1;
      if (result.applicationId) {
        summary.applicationsUpdated += 1;
      }
      if (result.alertCreated) {
        summary.alertsCreated += 1;
      }
    } catch (error) {
      summary.errors.push(
        error instanceof Error ? `${messageId}: ${error.message}` : `${messageId}: import failed`,
      );
    }
  }

  await setSetting(GMAIL_LAST_SYNC_SETTING_KEY, new Date().toISOString());
  await reconcileApplicationStatusesFromEmails();
  return summary;
}

async function processGmailMessage(message: ParsedGmailMessage) {
  const input: ClassifierEmailInput = {
    id: message.id,
    from: message.from,
    subject: message.subject,
    snippet: message.snippet,
    receivedAt: message.receivedAt,
  };

  return processClassifierEmail(input, {
    linkApplication: true,
    createAlerts: true,
  });
}
