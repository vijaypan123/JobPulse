import { formatCategoryLabel } from "./classifier";
import type { ClassificationResult, ClassifierEmailInput, EmailCategory } from "./classifier/types";
import {
  createAlert,
  createApplication,
  createEmail,
  findApplicationByCompanyAndRole,
  isMessageProcessed,
  markMessageProcessed,
  updateApplication,
} from "./db";
import type { ApplicationStatus, EmailRecord } from "./types";
import { getActiveClassifier } from "./classifier";

export type ProcessEmailResult = {
  email: EmailRecord;
  classification: ClassificationResult;
  skipped: boolean;
  applicationId?: number;
  alertCreated: boolean;
};

export type ProcessEmailOptions = {
  linkApplication?: boolean;
  createAlerts?: boolean;
};

const IMPORTANT_CATEGORIES: EmailCategory[] = [
  "interview_invitation",
  "assessment",
  "offer",
  "deadline",
  "recruiter_message",
  "rejection",
];

export async function classifyEmailInput(
  input: ClassifierEmailInput,
): Promise<ClassificationResult> {
  const classifier = getActiveClassifier();
  return classifier.classifyEmail(input);
}

export async function processClassifierEmail(
  input: ClassifierEmailInput,
  options: ProcessEmailOptions = {},
): Promise<ProcessEmailResult> {
  const alreadyProcessed = await isMessageProcessed(input.id);
  if (alreadyProcessed) {
    throw new Error(`Email ${input.id} has already been processed.`);
  }

  const classification = await classifyEmailInput(input);
  let applicationId: number | undefined;

  if (options.linkApplication !== false && classification.isJobRelated) {
    applicationId = await upsertApplicationFromClassification(classification, input.receivedAt);
  }

  const email = await createEmail({
    gmailMessageId: input.id,
    applicationId,
    sender: input.from,
    subject: input.subject,
    snippet: input.snippet,
    receivedAt: input.receivedAt,
    category: classification.category,
    importance: classification.importance,
    requiresAction: classification.requiresAction,
    summary: classification.summary,
    aiUsed: false,
  });

  await markMessageProcessed(
    input.id,
    classification.category,
    classification.importance === "high" || classification.requiresAction,
  );

  let alertCreated = false;
  if (options.createAlerts !== false) {
    alertCreated = await maybeCreateAlert(email.id, applicationId, classification);
  }

  return {
    email,
    classification,
    skipped: false,
    applicationId,
    alertCreated,
  };
}

export async function processClassifierEmails(
  inputs: ClassifierEmailInput[],
  options: ProcessEmailOptions = {},
): Promise<{ processed: ProcessEmailResult[]; skipped: string[] }> {
  const processed: ProcessEmailResult[] = [];
  const skipped: string[] = [];

  for (const input of inputs) {
    if (await isMessageProcessed(input.id)) {
      skipped.push(input.id);
      continue;
    }

    processed.push(await processClassifierEmail(input, options));
  }

  return { processed, skipped };
}

async function upsertApplicationFromClassification(
  classification: ClassificationResult,
  receivedAt: string,
): Promise<number | undefined> {
  const company = classification.company?.trim();
  if (!company) {
    return undefined;
  }

  const lastUpdate = receivedAt.slice(0, 10);
  const existing = await findApplicationByCompanyAndRole(company, classification.role);

  if (existing) {
    await updateApplication(existing.id, {
      company: existing.company,
      role: classification.role || existing.role,
      status: normalizeSuggestedStatus(classification.suggestedStatus, existing.status),
      dateApplied: existing.dateApplied,
      lastUpdate,
      deadline: classification.deadline ?? existing.deadline,
      source: "Gmail",
      notes: classification.summary,
    });
    return existing.id;
  }

  const created = await createApplication({
    company,
    role: classification.role,
    status: normalizeSuggestedStatus(classification.suggestedStatus, "Applied"),
    dateApplied: lastUpdate,
    lastUpdate,
    deadline: classification.deadline,
    source: "Gmail",
    notes: classification.summary,
  });

  return created.id;
}

function normalizeSuggestedStatus(
  suggestedStatus: ApplicationStatus,
  fallback: ApplicationStatus,
): ApplicationStatus {
  return suggestedStatus === "Unknown" ? fallback : suggestedStatus;
}

async function maybeCreateAlert(
  emailId: number,
  applicationId: number | undefined,
  classification: ClassificationResult,
): Promise<boolean> {
  if (!IMPORTANT_CATEGORIES.includes(classification.category)) {
    return false;
  }

  await createAlert({
    emailId,
    applicationId,
    title: formatCategoryLabel(classification.category),
    message: classification.summary,
    alertType: classification.category,
    read: false,
  });

  return true;
}
