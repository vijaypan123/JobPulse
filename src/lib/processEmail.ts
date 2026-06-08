import { formatCategoryLabel } from "./classifier";
import {
  pickBestApplicationStatus,
  resolveApplicationStatus,
  statusFromCategory,
} from "./classifier/status";
import type { ClassificationResult, ClassifierEmailInput, EmailCategory } from "./classifier/types";
import {
  createAlert,
  createApplication,
  createEmail,
  findApplicationByCompanyAndRole,
  getApplications,
  getEmails,
  isMessageProcessed,
  markMessageProcessed,
  updateApplication,
  updateEmail,
} from "./db";
import type { EmailRecord } from "./types";
import { classifyEmailWithProvider } from "./classifier/classifyEmail";
import { loadAiConfig } from "./classifier/aiConfig";
import { isAiClassificationEnabled } from "./classifier/createClassifier";

export type ProcessEmailResult = {
  email: EmailRecord;
  classification: ClassificationResult;
  skipped: boolean;
  applicationId?: number;
  alertCreated: boolean;
  aiUsed?: boolean;
};

export type ReclassifySummary = {
  total: number;
  aiUsed: number;
  localFallback: number;
  applicationsUpdated: number;
  errors: string[];
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

export async function reconcileApplicationStatusesFromEmails(): Promise<number> {
  const [applications, emails] = await Promise.all([getApplications(), getEmails()]);
  let updated = 0;

  for (const application of applications) {
    let linkedEmails = emails.filter((email) => email.applicationId === application.id);

    if (linkedEmails.length === 0) {
      const companyKey = application.company.trim().toLowerCase();
      linkedEmails = emails.filter((email) => {
        const haystack = `${email.subject} ${email.summary ?? ""} ${email.sender}`.toLowerCase();
        return companyKey.length >= 3 && haystack.includes(companyKey);
      });
    }

    if (linkedEmails.length === 0) {
      continue;
    }

    const candidateStatuses = linkedEmails.map((email) =>
      statusFromCategory(email.category as EmailCategory),
    );
    const nextStatus = pickBestApplicationStatus(application.status, candidateStatuses);

    if (nextStatus === application.status) {
      continue;
    }

    await updateApplication(application.id, {
      company: application.company,
      role: application.role,
      status: nextStatus,
      dateApplied: application.dateApplied,
      lastUpdate: application.lastUpdate,
      deadline: application.deadline,
      source: application.source,
      notes: application.notes,
    });
    updated += 1;
  }

  return updated;
}

export async function classifyEmailInput(
  input: ClassifierEmailInput,
): Promise<ClassificationResult> {
  const result = await classifyEmailWithProvider(input);
  return result.classification;
}

export async function classifyEmailInputDetailed(
  input: ClassifierEmailInput,
): Promise<{ classification: ClassificationResult; aiUsed: boolean }> {
  return classifyEmailWithProvider(input);
}

export async function processClassifierEmail(
  input: ClassifierEmailInput,
  options: ProcessEmailOptions = {},
): Promise<ProcessEmailResult> {
  const alreadyProcessed = await isMessageProcessed(input.id);
  if (alreadyProcessed) {
    throw new Error(`Email ${input.id} has already been processed.`);
  }

  const { classification, aiUsed } = await classifyEmailWithProvider(input);
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
    aiUsed,
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

export async function reclassifyImportedEmails(): Promise<ReclassifySummary> {
  const emails = await getEmails();
  const aiEnabled = isAiClassificationEnabled(await loadAiConfig());
  const summary: ReclassifySummary = {
    total: emails.length,
    aiUsed: 0,
    localFallback: 0,
    applicationsUpdated: 0,
    errors: [],
  };

  for (const email of emails) {
    try {
      const input: ClassifierEmailInput = {
        id: email.gmailMessageId,
        from: email.sender,
        subject: email.subject,
        snippet: email.snippet,
        receivedAt: email.receivedAt,
      };

      const { classification, aiUsed, fallbackReason } = await classifyEmailWithProvider(input);

      if (aiUsed) {
        summary.aiUsed += 1;
      } else if (aiEnabled) {
        summary.localFallback += 1;
        if (fallbackReason && summary.errors.length < 3) {
          summary.errors.push(fallbackReason);
        }
      }

      let applicationId = email.applicationId;
      if (classification.isJobRelated) {
        if (email.applicationId) {
          applicationId = await updateLinkedApplication(
            email.applicationId,
            classification,
            input.receivedAt,
          );
        } else {
          applicationId = await upsertApplicationFromClassification(classification, input.receivedAt);
        }

        if (applicationId) {
          summary.applicationsUpdated += 1;
        }
      }

      await updateEmail(email.id, {
        applicationId: applicationId ?? undefined,
        category: classification.category,
        importance: classification.importance,
        requiresAction: classification.requiresAction,
        summary: classification.summary,
        aiUsed,
      });
    } catch (error) {
      summary.errors.push(
        error instanceof Error
          ? `${email.subject}: ${error.message}`
          : `${email.subject}: reclassify failed`,
      );
    }
  }

  await reconcileApplicationStatusesFromEmails();
  return summary;
}

async function updateLinkedApplication(
  applicationId: number,
  classification: ClassificationResult,
  receivedAt: string,
): Promise<number | undefined> {
  const company = classification.company?.trim();
  if (!company) {
    return applicationId;
  }

  const applications = await getApplications();
  const existing = applications.find((application) => application.id === applicationId);
  if (!existing) {
    return upsertApplicationFromClassification(classification, receivedAt);
  }

  const lastUpdate = receivedAt.slice(0, 10);
  await updateApplication(applicationId, {
    company,
    role: classification.role || existing.role,
    status: resolveApplicationStatus(classification, existing.status),
    dateApplied: existing.dateApplied,
    lastUpdate,
    deadline: classification.deadline ?? existing.deadline,
    source: existing.source,
    notes: classification.summary,
  });

  return applicationId;
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
      status: resolveApplicationStatus(classification, existing.status),
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
    status: resolveApplicationStatus(classification, "Applied"),
    dateApplied: lastUpdate,
    lastUpdate,
    deadline: classification.deadline,
    source: "Gmail",
    notes: classification.summary,
  });

  return created.id;
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
