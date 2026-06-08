import { loadAiConfig } from "./aiConfig";
import { isAiClassificationEnabled } from "./createClassifier";
import { localRulesProvider } from "./LocalRulesProvider";
import { createLlmProvider, testAiConnection } from "./llmProviders";
import type { ClassificationResult, ClassifierEmailInput } from "./types";

export type ClassifyEmailResult = {
  classification: ClassificationResult;
  aiUsed: boolean;
  fallbackReason?: string;
};

export async function classifyEmailWithProvider(
  input: ClassifierEmailInput,
): Promise<ClassifyEmailResult> {
  const config = await loadAiConfig();

  if (!isAiClassificationEnabled(config)) {
    return {
      classification: await localRulesProvider.classifyEmail(input),
      aiUsed: false,
    };
  }

  try {
    const provider = createLlmProvider(config);
    const classification = await provider.classifyEmail(input);
    return { classification, aiUsed: true };
  } catch (error) {
    return {
      classification: await localRulesProvider.classifyEmail(input),
      aiUsed: false,
      fallbackReason:
        error instanceof Error ? error.message : "AI classification failed. Using local rules.",
    };
  }
}

export { testAiConnection };
