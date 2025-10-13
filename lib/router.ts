import { streamChatCompletion, type ChatMessage } from "./models/openai";

export type Provider = "openai" | "anthropic" | "google";

export interface Pricing {
  input: number;
  output: number;
}

export interface ModelRoute {
  id: string;
  provider: Provider;
  model: string;
  label: string;
  description: string;
  pricing: Pricing;
  call: (messages: ChatMessage[], options?: { signal?: AbortSignal }) => Promise<ReadableStream<Uint8Array>>;
}

const encoder = new TextEncoder();

function streamStub(message: string): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(message));
      controller.close();
    },
  });
}

const ROUTES: ModelRoute[] = [
  {
    id: "openai:gpt-4o-mini",
    provider: "openai",
    model: "gpt-4o-mini",
    label: "OpenAI GPT-4o mini",
    description: "Default route with live streaming via OpenAI Chat Completions API.",
    pricing: {
      input: 0.15,
      output: 0.6,
    },
    async call(messages, options) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing OPENAI_API_KEY");
      }
      return streamChatCompletion({ apiKey, messages, model: "gpt-4o-mini", signal: options?.signal });
    },
  },
  {
    id: "anthropic:claude-3-sonnet",
    provider: "anthropic",
    model: "claude-3-sonnet-20240229",
    label: "Anthropic Claude 3 Sonnet (stub)",
    description: "Stubbed route indicating missing Anthropic integration.",
    pricing: {
      input: 0,
      output: 0,
    },
    async call() {
      return streamStub("Anthropic provider not configured. Add ANTHROPIC_API_KEY to enable this route.");
    },
  },
  {
    id: "google:gemini-pro",
    provider: "google",
    model: "gemini-pro",
    label: "Google Gemini Pro (stub)",
    description: "Stubbed route indicating missing Google Generative AI integration.",
    pricing: {
      input: 0,
      output: 0,
    },
    async call() {
      return streamStub("Google Gemini provider not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to enable this route.");
    },
  },
];

export const MODEL_ROUTES = ROUTES;
export const DEFAULT_ROUTE_ID = ROUTES[0].id;

export function getRouteById(id: string): ModelRoute {
  return ROUTES.find((route) => route.id === id) ?? ROUTES[0];
}
