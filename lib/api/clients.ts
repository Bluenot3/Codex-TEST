import { estimateCost } from "../utils/cost";
import { isBrowser } from "../utils/guards";

export interface StreamCallbacks {
  onToken?: (token: string) => void;
  onComplete?: (payload: StreamResult) => void;
  onError?: (error: Error) => void;
  onUsage?: (usage: Partial<StreamUsage>) => void;
}

export interface StreamRequest {
  url: string;
  apiKey: string;
  body: Record<string, unknown>;
  model: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  callbacks?: StreamCallbacks;
}

export interface StreamUsage {
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  cost: number;
}

export interface StreamResult {
  text: string;
  usage: StreamUsage;
  raw: unknown;
}

const OPENAI_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

const redactSecrets = (message: string) => message.replace(/sk-[a-zA-Z0-9]{10,}/g, "sk-***");

export const streamOpenAIChat = async ({
  apiKey,
  body,
  model,
  headers = {},
  signal,
  callbacks = {},
  url = OPENAI_COMPLETIONS_URL,
}: StreamRequest & { url?: string }) => {
  const controller = new AbortController();
  const start = performance.now();
  const mergedSignal = mergeSignals(signal, controller.signal);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...headers,
      },
      body: JSON.stringify({
        stream: true,
        ...body,
        model,
      }),
      signal: mergedSignal,
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      throw new Error(`OpenAI request failed: ${redactSecrets(errorText)}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = "";
    let promptTokens = 0;
    let completionTokens = 0;
    let aggregated = "";

    while (!done) {
      const chunk = await reader.read();
      done = chunk.done ?? false;
      const value = chunk.value ? decoder.decode(chunk.value, { stream: !done }) : "";
      buffer += value;
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const event of events) {
        if (!event.trim()) continue;
        if (event.trim() === "data: [DONE]") continue;
        const payload = event.replace(/^data: /, "");
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{
              delta?: { content?: string };
              finish_reason?: string;
            }>;
            usage?: {
              prompt_tokens?: number;
              completion_tokens?: number;
            };
          };
          const token = json.choices?.[0]?.delta?.content;
          if (token) {
            aggregated += token;
            callbacks.onToken?.(token);
          }
          if (json.usage) {
            promptTokens = json.usage.prompt_tokens ?? promptTokens;
            completionTokens = json.usage.completion_tokens ?? completionTokens;
            callbacks.onUsage?.({ promptTokens, completionTokens });
          }
        } catch (error) {
          console.warn("Failed to parse stream chunk", error);
        }
      }
    }

    if (!completionTokens && aggregated) {
      completionTokens = Math.max(1, Math.round(aggregated.length / 4));
    }
    const latencyMs = performance.now() - start;
    const usage = buildUsage(model, promptTokens, completionTokens, latencyMs);
    callbacks.onComplete?.({ text: aggregated, usage, raw: null });
    return usage;
  } catch (error) {
    const sanitized = new Error(redactSecrets(error instanceof Error ? error.message : String(error)));
    callbacks.onError?.(sanitized);
    throw sanitized;
  } finally {
    controller.abort();
  }
};

const buildUsage = (model: string, promptTokens: number, completionTokens: number, latencyMs: number): StreamUsage => ({
  model,
  promptTokens,
  completionTokens,
  latencyMs,
  cost: estimateCost(model, promptTokens, completionTokens).cost,
});

const mergeSignals = (external: AbortSignal | undefined, internal: AbortSignal) => {
  if (!external) return internal;
  if (!isBrowser()) return internal;
  const controller = new AbortController();
  const forward = () => controller.abort();
  external.addEventListener("abort", forward, { once: true });
  internal.addEventListener("abort", forward, { once: true });
  return controller.signal;
};

export const withTimeout = (timeoutMs: number, signal?: AbortSignal) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
};
