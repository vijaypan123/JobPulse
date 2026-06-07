export const APPLICATION_STATUSES = [
  "Applied",
  "Assessment",
  "Interview",
  "Final Round",
  "Offer",
  "Rejected",
  "Closed",
  "No Response",
  "Unknown",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type Application = {
  id: number;
  company: string;
  role: string;
  status: ApplicationStatus;
  dateApplied: string;
  lastUpdate: string;
  deadline?: string;
  source: string;
  notes?: string;
  actionNeeded: boolean;
};

export type ApplicationInput = {
  company: string;
  role?: string;
  status: ApplicationStatus;
  dateApplied?: string;
  lastUpdate?: string;
  deadline?: string;
  source?: string;
  notes?: string;
};

export type EmailRecord = {
  id: number;
  gmailMessageId: string;
  applicationId?: number;
  sender: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  category: string;
  importance: "low" | "medium" | "high";
  requiresAction: boolean;
  summary?: string;
  aiUsed: boolean;
};

export type EmailInput = {
  gmailMessageId: string;
  applicationId?: number;
  sender?: string;
  subject?: string;
  snippet?: string;
  receivedAt?: string;
  category?: string;
  importance?: "low" | "medium" | "high";
  requiresAction?: boolean;
  summary?: string;
  aiUsed?: boolean;
};

export type AlertRecord = {
  id: number;
  emailId?: number;
  applicationId?: number;
  title: string;
  message: string;
  alertType: string;
  read: boolean;
  createdAt: string;
};

export type AlertInput = {
  emailId?: number;
  applicationId?: number;
  title: string;
  message: string;
  alertType?: string;
  read?: boolean;
};

export type DeadlineRecord = {
  id: number;
  company: string;
  role: string;
  label: string;
  dueDate: string;
  urgency: "low" | "medium" | "high";
};

export type SortOption = "lastUpdate" | "deadline";

export type ApplicationRow = {
  id: number;
  company: string;
  role: string | null;
  status: string;
  date_applied: string | null;
  last_update: string | null;
  deadline: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EmailRow = {
  id: number;
  gmail_message_id: string;
  application_id: number | null;
  sender: string | null;
  subject: string | null;
  snippet: string | null;
  received_at: string | null;
  category: string | null;
  importance: string | null;
  requires_action: number;
  summary: string | null;
  ai_used: number;
  created_at: string;
};

export type AlertRow = {
  id: number;
  email_id: number | null;
  application_id: number | null;
  title: string;
  message: string;
  alert_type: string | null;
  read: number;
  created_at: string;
};

export type ProcessedMessageRow = {
  id: number;
  gmail_message_id: string;
  processed_at: string;
  category: string | null;
  important: number;
};
