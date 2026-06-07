import {
  buildSearchText,
  extractCompany,
  extractDeadline,
  extractRole,
  formatCategoryLabel,
  formatConfidence,
} from "./extractors";
import { CLASSIFICATION_RULES } from "./rules";
import type {
  AIProvider,
  ClassificationResult,
  ClassifierEmailInput,
  EmailCategory,
  RuleDefinition,
} from "./types";

const MIN_CONFIDENCE = 0.2;

function scoreRule(text: string, rule: RuleDefinition): number {
  let matches = 0;

  for (const keyword of rule.keywords) {
    if (text.includes(keyword.toLowerCase())) {
      matches += 1;
    }
  }

  if (matches === 0) {
    return 0;
  }

  const coverage = matches / rule.keywords.length;
  return Math.min(0.99, rule.baseConfidence * coverage + matches * 0.04);
}

function pickBestRule(text: string): { rule: RuleDefinition; score: number } | null {
  let best: { rule: RuleDefinition; score: number } | null = null;

  for (const rule of CLASSIFICATION_RULES) {
    const score = scoreRule(text, rule);
    if (score <= 0) {
      continue;
    }

    if (
      !best ||
      score > best.score ||
      (score === best.score && rule.priority > best.rule.priority)
    ) {
      best = { rule, score };
    }
  }

  return best;
}

function buildSummary(
  input: ClassifierEmailInput,
  result: Omit<ClassificationResult, "summary">,
): string {
  const company = result.company ?? "The company";
  const roleSuffix = result.role ? ` for ${result.role}` : "";
  const confidence = formatConfidence(result.confidence);

  const categoryMessages: Record<EmailCategory, string> = {
    application_confirmation: `${company} confirmed receipt of your application${roleSuffix}.`,
    interview_invitation: `${company} invited you to interview${roleSuffix}.`,
    assessment: `${company} requested an assessment${roleSuffix}.`,
    offer: `${company} sent an offer${roleSuffix}.`,
    rejection: `${company} declined to move forward${roleSuffix}.`,
    deadline: `${company} shared a deadline${roleSuffix}.`,
    recruiter_message: `${company} recruiter reached out${roleSuffix}.`,
    job_alert: `New job alert detected${roleSuffix}.`,
    unknown: `Possible job-related message from ${input.from}.`,
  };

  const deadlineSuffix = result.deadline ? ` Deadline: ${result.deadline}.` : "";
  return `${categoryMessages[result.category]} Suggested status: ${result.suggestedStatus}. Confidence: ${confidence}.${deadlineSuffix}`;
}

function unknownResult(input: ClassifierEmailInput): ClassificationResult {
  return {
    isJobRelated: false,
    category: "unknown",
    importance: "low",
    requiresAction: false,
    suggestedStatus: "Unknown",
    summary: `No strong job-related rule matched for "${input.subject}".`,
    confidence: 0,
  };
}

export class LocalRulesProvider implements AIProvider {
  readonly name = "Local Rules";

  async classifyEmail(input: ClassifierEmailInput): Promise<ClassificationResult> {
    const text = buildSearchText(input);
    const match = pickBestRule(text);

    if (!match || match.score < MIN_CONFIDENCE) {
      return unknownResult(input);
    }

    const company = extractCompany(input);
    const role = extractRole(input);
    const deadline = extractDeadline(text);
    const category = match.rule.category;

    const result: Omit<ClassificationResult, "summary"> = {
      isJobRelated: category !== "unknown",
      company,
      role,
      category,
      importance: match.rule.importance,
      requiresAction: match.rule.requiresAction,
      deadline,
      suggestedStatus: match.rule.suggestedStatus,
      confidence: Number(match.score.toFixed(2)),
    };

    return {
      ...result,
      summary: buildSummary(input, result),
    };
  }

  async summarizeEmail(input: ClassifierEmailInput): Promise<string> {
    const result = await this.classifyEmail(input);
    return `${formatCategoryLabel(result.category)}: ${result.summary}`;
  }
}

export const localRulesProvider = new LocalRulesProvider();
