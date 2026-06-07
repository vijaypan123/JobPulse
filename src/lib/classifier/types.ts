import type { ApplicationStatus } from "../types";

export const EMAIL_CATEGORIES = [
  "application_confirmation",
  "interview_invitation",
  "assessment",
  "offer",
  "rejection",
  "deadline",
  "recruiter_message",
  "job_alert",
  "unknown",
] as const;

export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];

export type ClassifierEmailInput = {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  body?: string;
  receivedAt: string;
};

export type ClassificationResult = {
  isJobRelated: boolean;
  company?: string;
  role?: string;
  category: EmailCategory;
  importance: "low" | "medium" | "high";
  requiresAction: boolean;
  deadline?: string;
  suggestedStatus: ApplicationStatus;
  summary: string;
  confidence: number;
};

export interface AIProvider {
  readonly name: string;
  classifyEmail(input: ClassifierEmailInput): Promise<ClassificationResult>;
  summarizeEmail?(input: ClassifierEmailInput): Promise<string>;
}

export type RuleDefinition = {
  category: EmailCategory;
  keywords: string[];
  suggestedStatus: ApplicationStatus;
  importance: ClassificationResult["importance"];
  requiresAction: boolean;
  baseConfidence: number;
  priority: number;
};
