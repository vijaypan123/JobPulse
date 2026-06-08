import { deleteSetting, getSetting, setSetting } from "../db";

export type AiProviderType = "local" | "ollama" | "gemini" | "openai_compatible";
export type AiDataMode = "subject" | "subject_snippet" | "body";

export type AiConfig = {
  enabled: boolean;
  provider: AiProviderType;
  model: string;
  baseUrl: string;
  apiKey: string;
  dataMode: AiDataMode;
};

export const AI_ENABLED_KEY = "ai_enabled";
export const AI_PROVIDER_KEY = "ai_provider";
export const AI_MODEL_KEY = "ai_model";
export const AI_BASE_URL_KEY = "ai_base_url";
export const AI_API_KEY_KEY = "ai_api_key";
export const AI_DATA_MODE_KEY = "ai_data_mode";

export const DEFAULT_OLLAMA_BASE_URL =
  import.meta.env.VITE_OLLAMA_BASE_URL?.trim() || "http://localhost:11434";
export const DEFAULT_OLLAMA_MODEL =
  import.meta.env.VITE_OLLAMA_MODEL?.trim() || "llama3.2";

export const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash-lite";
export const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export const DEFAULT_OPENAI_COMPAT_MODEL = "llama-3.1-8b-instant";
export const DEFAULT_OPENAI_COMPAT_BASE_URL = "https://api.groq.com/openai/v1";

const DEFAULTS: Record<AiProviderType, Pick<AiConfig, "model" | "baseUrl">> = {
  local: { model: "", baseUrl: "" },
  ollama: { model: DEFAULT_OLLAMA_MODEL, baseUrl: DEFAULT_OLLAMA_BASE_URL },
  gemini: { model: DEFAULT_GEMINI_MODEL, baseUrl: DEFAULT_GEMINI_BASE_URL },
  openai_compatible: {
    model: DEFAULT_OPENAI_COMPAT_MODEL,
    baseUrl: DEFAULT_OPENAI_COMPAT_BASE_URL,
  },
};

export function getDefaultAiConfig(provider: AiProviderType = "local"): AiConfig {
  const defaults = DEFAULTS[provider];
  return {
    enabled: false,
    provider,
    model: defaults.model,
    baseUrl: defaults.baseUrl,
    apiKey: "",
    dataMode: "subject_snippet",
  };
}

export async function loadAiConfig(): Promise<AiConfig> {
  const provider = (await getSetting(AI_PROVIDER_KEY)) as AiProviderType | null;
  const resolvedProvider = provider ?? "local";
  const defaults = getDefaultAiConfig(resolvedProvider);

  return {
    enabled: (await getSetting(AI_ENABLED_KEY)) === "1",
    provider: resolvedProvider,
    model: (await getSetting(AI_MODEL_KEY)) ?? defaults.model,
    baseUrl: (await getSetting(AI_BASE_URL_KEY)) ?? defaults.baseUrl,
    apiKey: (await getSetting(AI_API_KEY_KEY)) ?? "",
    dataMode: ((await getSetting(AI_DATA_MODE_KEY)) as AiDataMode | null) ?? "subject_snippet",
  };
}

export async function saveAiConfig(config: AiConfig): Promise<void> {
  await setSetting(AI_ENABLED_KEY, config.enabled ? "1" : "0");
  await setSetting(AI_PROVIDER_KEY, config.provider);
  await setSetting(AI_MODEL_KEY, config.model);
  await setSetting(AI_BASE_URL_KEY, config.baseUrl);
  await setSetting(AI_DATA_MODE_KEY, config.dataMode);

  if (config.apiKey.trim()) {
    await setSetting(AI_API_KEY_KEY, config.apiKey.trim());
  }
}

export async function clearAiApiKey(): Promise<void> {
  await deleteSetting(AI_API_KEY_KEY);
}

export function providerRequiresApiKey(provider: AiProviderType): boolean {
  return provider === "gemini" || provider === "openai_compatible";
}

export function providerLabel(provider: AiProviderType): string {
  switch (provider) {
    case "local":
      return "Local rules only";
    case "ollama":
      return "Ollama (free, local)";
    case "gemini":
      return "Google Gemini (free tier)";
    case "openai_compatible":
      return "OpenAI-compatible API";
    default:
      return provider;
  }
}
