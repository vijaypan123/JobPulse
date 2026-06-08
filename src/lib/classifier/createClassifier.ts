import { loadAiConfig, type AiConfig } from "./aiConfig";
import { createLlmProvider } from "./llmProviders";
import { localRulesProvider } from "./LocalRulesProvider";
import type { AIProvider } from "./types";

export async function getActiveClassifier(): Promise<AIProvider> {
  const config = await loadAiConfig();
  return buildClassifier(config);
}

export async function buildClassifier(config: AiConfig): Promise<AIProvider> {
  if (!config.enabled || config.provider === "local") {
    return localRulesProvider;
  }

  const llmProvider = createLlmProvider(config);

  return {
    name: llmProvider.name,
    async classifyEmail(input) {
      try {
        return await llmProvider.classifyEmail(input);
      } catch {
        return localRulesProvider.classifyEmail(input);
      }
    },
    summarizeEmail: llmProvider.summarizeEmail,
  };
}

export function isAiClassificationEnabled(config: AiConfig): boolean {
  return config.enabled && config.provider !== "local";
}
