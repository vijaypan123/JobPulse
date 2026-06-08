import {
  buildSearchText,
  extractCompany,
  extractDeadline,
  extractRole,
  formatCategoryLabel,
  formatConfidence,
  isNonApplicationSender,
} from "./extractors";
import { statusFromCategory } from "./status";
import { CLASSIFICATION_RULES } from "./rules";
import type {
  AIProvider,
  ClassificationResult,
  ClassifierEmailInput,
  EmailCategory,
  RuleDefinition,
} from "./types";

const MIN_CONFIDENCE = 0.2;

const HIRING_SIGNAL_KEYWORDS = [
  "your application",
  "application for",
  "applied for",
  "job application",
  "candidacy",
  "our candidate",
  "hiring process",
  "recruitment",
  "people team",
  "talent team",
  "human resources",
  "under review",
  "reviewing your application",
  "shortlisted",
  "background check",
  "reference check",
  "status update",
  "update on your application",
];

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

const REJECTION_SIGNALS = [
  "not selected",
  "moving forward with other",
  "other candidates",
  "decided not to move forward",
  "unable to move forward",
  "will not be proceeding",
  "regret to inform",
  "unfortunately",
  "not moving forward",
  "will not be moving forward",
  "cannot offer you",
  "we have decided",
  "not advance",
  "filled the position",
  "chosen to proceed with other",
  "decided to pursue",
];

function hasRejectionSignals(text: string): boolean {
  return REJECTION_SIGNALS.some((signal) => text.includes(signal));
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

  if (!best) {
    return null;
  }

  if (best.rule.category !== "rejection" && hasRejectionSignals(text)) {
    const rejectionRule = CLASSIFICATION_RULES.find((rule) => rule.category === "rejection");
    if (rejectionRule) {
      const rejectionScore = scoreRule(text, rejectionRule);
      if (rejectionScore > 0) {
        return {
          rule: rejectionRule,
          score: Math.max(rejectionScore, best.score, 0.85),
        };
      }
    }
  }

  if (best.rule.category === "assessment" && hasRejectionSignals(text)) {
    const rejectionRule = CLASSIFICATION_RULES.find((rule) => rule.category === "rejection");
    if (rejectionRule) {
      return { rule: rejectionRule, score: 0.88 };
    }
  }

  return best;
}

function inferFallbackClassification(
  input: ClassifierEmailInput,
  text: string,
): { rule: RuleDefinition; score: number } | null {
  const signalMatches = HIRING_SIGNAL_KEYWORDS.filter((keyword) => text.includes(keyword)).length;
  if (signalMatches === 0) {
    return null;
  }

  const company = extractCompany(input);
  if (!company) {
    return null;
  }

  const fallbackRule =
    CLASSIFICATION_RULES.find((rule) => rule.category === "application_confirmation") ??
    CLASSIFICATION_RULES[0];

  return {
    rule: fallbackRule,
    score: Math.min(0.75, 0.45 + signalMatches * 0.05),
  };
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
    if (isNonApplicationSender(input.from)) {
      return unknownResult(input);
    }

    const text = buildSearchText(input);
    const match = pickBestRule(text) ?? inferFallbackClassification(input, text);

    if (!match || match.score < MIN_CONFIDENCE) {
      return unknownResult(input);
    }

    const company = extractCompany(input);
    const role = extractRole(input);
    const deadline = extractDeadline(text);
    const category = match.rule.category;
    const isJobRelated =
      category !== "unknown" && category !== "job_alert" && Boolean(company);
    const suggestedStatus = statusFromCategory(category);
    const result: Omit<ClassificationResult, "summary"> = {
      isJobRelated,
      company,
      role,
      category,
      importance: match.rule.importance,
      requiresAction: match.rule.requiresAction,
      deadline,
      suggestedStatus,
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
