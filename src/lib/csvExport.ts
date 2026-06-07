import { getAlerts, getApplications, getEmails } from "./db";
import type { AlertRecord, Application, EmailRecord } from "./types";

export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function rowsToCsv(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(escapeCsvValue).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvValue).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const APPLICATION_HEADERS = [
  "id",
  "company",
  "role",
  "status",
  "date_applied",
  "last_update",
  "deadline",
  "source",
  "notes",
  "action_needed",
];

const EMAIL_HEADERS = [
  "id",
  "gmail_message_id",
  "application_id",
  "sender",
  "subject",
  "snippet",
  "received_at",
  "category",
  "importance",
  "requires_action",
  "summary",
  "ai_used",
];

const ALERT_HEADERS = [
  "id",
  "email_id",
  "application_id",
  "title",
  "message",
  "alert_type",
  "read",
  "created_at",
];

export function applicationsToCsv(applications: Application[]): string {
  const rows = applications.map((application) => [
    application.id,
    application.company,
    application.role,
    application.status,
    application.dateApplied,
    application.lastUpdate,
    application.deadline ?? "",
    application.source,
    application.notes ?? "",
    application.actionNeeded ? "true" : "false",
  ]);

  return rowsToCsv(APPLICATION_HEADERS, rows);
}

export function emailsToCsv(emails: EmailRecord[]): string {
  const rows = emails.map((email) => [
    email.id,
    email.gmailMessageId,
    email.applicationId ?? "",
    email.sender,
    email.subject,
    email.snippet,
    email.receivedAt,
    email.category,
    email.importance,
    email.requiresAction ? "true" : "false",
    email.summary ?? "",
    email.aiUsed ? "true" : "false",
  ]);

  return rowsToCsv(EMAIL_HEADERS, rows);
}

export function alertsToCsv(alerts: AlertRecord[]): string {
  const rows = alerts.map((alert) => [
    alert.id,
    alert.emailId ?? "",
    alert.applicationId ?? "",
    alert.title,
    alert.message,
    alert.alertType,
    alert.read ? "true" : "false",
    alert.createdAt,
  ]);

  return rowsToCsv(ALERT_HEADERS, rows);
}

export async function exportApplicationsCsv(
  applications?: Application[],
): Promise<void> {
  const rows = applications ?? (await getApplications());
  downloadCsv("applications.csv", applicationsToCsv(rows));
}

export async function exportEmailsCsv(): Promise<void> {
  const emails = await getEmails();
  downloadCsv("emails.csv", emailsToCsv(emails));
}

export async function exportAlertsCsv(): Promise<void> {
  const alerts = await getAlerts();
  downloadCsv("alerts.csv", alertsToCsv(alerts));
}

export async function exportAllCsv(): Promise<void> {
  await exportApplicationsCsv();
  await exportEmailsCsv();
  await exportAlertsCsv();
}
