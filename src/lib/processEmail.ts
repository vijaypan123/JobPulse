import { getActiveClassifier } from "./classifier";
import type { ClassificationResult, ClassifierEmailInput } from "./classifier/types";
import { createEmail, isMessageProcessed, markMessageProcessed } from "./db";
import type { EmailRecord } from "./types";

export type ProcessEmailResult = {
  email: EmailRecord;
  classification: ClassificationResult;
  skipped: boolean;
};

export async function classifyEmailInput(
  input: ClassifierEmailInput,
): Promise<ClassificationResult> {
  const classifier = getActiveClassifier();
  return classifier.classifyEmail(input);
}

export async function processClassifierEmail(
  input: ClassifierEmailInput,
): Promise<ProcessEmailResult> {
  const alreadyProcessed = await isMessageProcessed(input.id);
  if (alreadyProcessed) {
    throw new Error(`Email ${input.id} has already been processed.`);
  }

  const classification = await classifyEmailInput(input);
  const email = await createEmail({
    gmailMessageId: input.id,
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

  return {
    email,
    classification,
    skipped: false,
  };
}

export async function processClassifierEmails(
  inputs: ClassifierEmailInput[],
): Promise<{ processed: ProcessEmailResult[]; skipped: string[] }> {
  const processed: ProcessEmailResult[] = [];
  const skipped: string[] = [];

  for (const input of inputs) {
    if (await isMessageProcessed(input.id)) {
      skipped.push(input.id);
      continue;
    }

    processed.push(await processClassifierEmail(input));
  }

  return { processed, skipped };
}
