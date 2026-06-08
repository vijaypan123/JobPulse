import type { ApplicationStatus } from "../types";
import type { AiDataMode } from "./aiConfig";
import type { ClassificationResult, ClassifierEmailInput, EmailCategory } from "./types";
import { statusFromCategory } from "./status";
import { isInvalidCompanyName } from "./extractors";

const VALID_CATEGORIES: EmailCategory[] = [
  "application_confirmation",
  "interview_invitation",
  "assessment",
  "offer",
  "rejection",
  "deadline",
  "recruiter_message",
  "job_alert",
  "unknown",
];

const VALID_STATUSES: ApplicationStatus[] = [
  "Applied",
  "Assessment",
  "Interview",
  "Final Round",
  "Offer",
  "Rejected",
  "Closed",
  "No Response",
  "Unknown",
];

export const CLASSIFICATION_SYSTEM_PROMPT = `You classify job-search emails for a private desktop tracker.

Return ONLY valid JSON with this shape:
{
  "isJobRelated": boolean,
  "company": string | null,
  "role": string | null,
  "category": "application_confirmation" | "interview_invitation" | "assessment" | "offer" | "rejection" | "deadline" | "recruiter_message" | "job_alert" | "unknown",
  "importance": "low" | "medium" | "high",
  "requiresAction": boolean,
  "deadline": "YYYY-MM-DD" | null,
  "suggestedStatus": "Applied" | "Assessment" | "Interview" | "Final Round" | "Offer" | "Rejected" | "Closed" | "No Response" | "Unknown",
  "summary": string,
  "confidence": number
}

Rules:
- Ignore LinkedIn/Indeed job alerts unless they confirm a specific application the user already submitted.
- Extract the employer company from the sender name or email signature, NOT the email subject boilerplate.
- Subject lines like "Thank you for your application - Role Title" mean company comes from sender (e.g. "Kia Recruiting Team" -> Kia), NOT "Thank you for your application".
- ATS vendors (SuccessFactors, Greenhouse, Lever, Workday) are not the company — use the employer named in the From header or signature.
- Rejection emails from staffing firms (Robert Half, etc.) are category "rejection", NOT "assessment", even if they mention skills or review.
- Application confirmation / under review emails are category "application_confirmation" with status Applied.
- Use "unknown" when the email is not about a specific job application.
- Prefer the hiring stage implied by the email (Applied, Assessment, Interview, Offer, Rejected).
- Keep summary to one sentence.
- confidence is 0 to 1.`;

export function buildEmailPayload(input: ClassifierEmailInput, dataMode: AiDataMode): string {
  const lines = [`From: ${input.from}`, `Subject: ${input.subject}`, `Received: ${input.receivedAt}`];

  if (dataMode === "subject_snippet" || dataMode === "body") {
    lines.push(`Snippet: ${input.snippet}`);
  }

  if (dataMode === "body" && input.body) {
    lines.push(`Body: ${input.body.slice(0, 4000)}`);
  }

  return lines.join("\n");
}

export function parseClassificationResponse(raw: string): ClassificationResult | null {
  const jsonText = extractJsonObject(raw);
  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText) as Partial<ClassificationResult>;
    const category = VALID_CATEGORIES.includes(parsed.category as EmailCategory)
      ? (parsed.category as EmailCategory)
      : "unknown";
    const suggestedStatus = VALID_STATUSES.includes(parsed.suggestedStatus as ApplicationStatus)
      ? (parsed.suggestedStatus as ApplicationStatus)
      : statusFromCategory(category);
    const importance =
      parsed.importance === "high" || parsed.importance === "medium" || parsed.importance === "low"
        ? parsed.importance
        : "low";
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.7;

    const companyRaw = typeof parsed.company === "string" ? parsed.company.trim() : "";
    const company =
      companyRaw && !isInvalidCompanyName(companyRaw) ? companyRaw : undefined;

    return {
      isJobRelated: Boolean(parsed.isJobRelated) && category !== "unknown" && category !== "job_alert",
      company,
      role: typeof parsed.role === "string" ? parsed.role.trim() || undefined : undefined,
      category,
      importance,
      requiresAction: Boolean(parsed.requiresAction),
      deadline:
        typeof parsed.deadline === "string" && parsed.deadline.trim()
          ? parsed.deadline.trim()
          : undefined,
      suggestedStatus,
      summary:
        typeof parsed.summary === "string" && parsed.summary.trim()
          ? parsed.summary.trim()
          : "AI classified this email.",
      confidence: Number(confidence.toFixed(2)),
    };
  } catch {
    return null;
  }
}

function extractJsonObject(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return null;
}
