import type { AiConfig } from "./aiConfig";
import {
  buildEmailPayload,
  CLASSIFICATION_SYSTEM_PROMPT,
  parseClassificationResponse,
} from "./prompts";
import type { AIProvider, ClassificationResult, ClassifierEmailInput } from "./types";

function resolveOllamaUrl(baseUrl: string, path: string): string {
  if (import.meta.env.DEV && baseUrl.includes("localhost:11434")) {
    return `/api/ollama${path}`;
  }

  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

async function requestOllama(
  config: AiConfig,
  input: ClassifierEmailInput,
): Promise<ClassificationResult> {
  const response = await fetch(resolveOllamaUrl(config.baseUrl, "/api/chat"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      stream: false,
      format: "json",
      messages: [
        { role: "system", content: CLASSIFICATION_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildEmailPayload(input, config.dataMode),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama request failed (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as { message?: { content?: string } };
  const parsed = parseClassificationResponse(payload.message?.content ?? "");
  if (!parsed) {
    throw new Error("Ollama returned an unreadable classification response.");
  }

  return parsed;
}

function formatGeminiError(status: number, errorText: string): string {
  if (status === 429 || errorText.includes("RESOURCE_EXHAUSTED") || errorText.includes("quota")) {
    return (
      "Gemini free tier is not available for this API key or model (quota shows limit: 0). " +
      "This usually means the key is from the wrong place, not that you already used Gemini. " +
      "Create a key at https://aistudio.google.com/apikey (Google AI Studio — not your Gmail OAuth client), " +
      "set model to gemini-2.0-flash-lite, wait a minute, and try again. Or use Ollama for free local AI."
    );
  }

  if (status === 403 || errorText.includes("API key not valid")) {
    return (
      "Gemini rejected this API key. Use a key from Google AI Studio (https://aistudio.google.com/apikey), " +
      "not a Google Cloud OAuth client ID/secret."
    );
  }

  return `Gemini request failed (${status}). Check your model name and API key.`;
}

async function requestGemini(
  config: AiConfig,
  input: ClassifierEmailInput,
): Promise<ClassificationResult> {
  if (!config.apiKey.trim()) {
    throw new Error("Gemini API key is missing.");
  }

  const url = `${config.baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${CLASSIFICATION_SYSTEM_PROMPT}\n\nClassify this email:\n\n${buildEmailPayload(input, config.dataMode)}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(formatGeminiError(response.status, errorText));
  }

  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") ?? "";
  const parsed = parseClassificationResponse(text);
  if (!parsed) {
    throw new Error("Gemini returned an unreadable classification response.");
  }

  return parsed;
}

async function requestOpenAiCompatible(
  config: AiConfig,
  input: ClassifierEmailInput,
): Promise<ClassificationResult> {
  if (!config.apiKey.trim()) {
    throw new Error("API key is missing.");
  }

  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: CLASSIFICATION_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildEmailPayload(input, config.dataMode),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI request failed (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const parsed = parseClassificationResponse(payload.choices?.[0]?.message?.content ?? "");
  if (!parsed) {
    throw new Error("AI provider returned an unreadable classification response.");
  }

  return parsed;
}

export function createLlmProvider(config: AiConfig): AIProvider {
  switch (config.provider) {
    case "ollama":
      return {
        name: "Ollama",
        classifyEmail: (input) => requestOllama(config, input),
      };
    case "gemini":
      return {
        name: "Google Gemini",
        classifyEmail: (input) => requestGemini(config, input),
      };
    case "openai_compatible":
      return {
        name: "OpenAI-compatible",
        classifyEmail: (input) => requestOpenAiCompatible(config, input),
      };
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

export async function testAiConnection(config: AiConfig): Promise<string> {
  const sampleInput: ClassifierEmailInput = {
    id: "test-email",
    from: "Recruiting <careers@example.com>",
    subject: "Interview invitation — Financial Analyst at Example Corp",
    snippet: "We would like to schedule a 30 minute interview for the Financial Analyst role.",
    receivedAt: new Date().toISOString(),
  };

  const provider = createLlmProvider(config);
  const result = await provider.classifyEmail(sampleInput);
  return `${provider.name} connected. Sample result: ${result.category} (${Math.round(result.confidence * 100)}% confidence).`;
}
