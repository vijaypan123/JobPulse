import { localRulesProvider } from "./LocalRulesProvider";
import type { AIProvider } from "./types";

export type { AIProvider, ClassificationResult, ClassifierEmailInput, EmailCategory } from "./types";
export { LocalRulesProvider, localRulesProvider } from "./LocalRulesProvider";
export { CLASSIFICATION_RULES } from "./rules";
export { formatCategoryLabel, formatConfidence } from "./extractors";

export function getActiveClassifier(): AIProvider {
  return localRulesProvider;
}
