export type ModelProvider = "openai" | "anthropic" | "google" | "mistral";
export type ModelCapability = "speed" | "reasoning" | "vision" | "code";

export interface ModelProfile {
  id: ModelCapability;
  label: string;
  description: string;
  defaultModel: string;
  fallbacks: string[];
  notes?: string;
}

export const MODEL_ROUTES: ModelProfile[] = [
  {
    id: "speed",
    label: "Speed",
    description: "Low-latency drafting and triage.",
    defaultModel: "openai:gpt-4o-mini",
    fallbacks: ["openai:gpt-3.5-turbo", "mistral:large"],
  },
  {
    id: "reasoning",
    label: "Reasoning",
    description: "Deep chain-of-thought and complex planning.",
    defaultModel: "openai:gpt-4o",
    fallbacks: ["anthropic:claude-3-sonnet", "openai:gpt-4o-mini"],
  },
  {
    id: "vision",
    label: "Vision",
    description: "Image + text interpretation with regional prompts.",
    defaultModel: "openai:gpt-4o-mini",
    fallbacks: ["openai:gpt-4o"],
    notes: "Requires multimodal access.",
  },
  {
    id: "code",
    label: "Code",
    description: "Tool-formatted completions for automation.",
    defaultModel: "openai:gpt-4o-mini",
    fallbacks: ["openai:gpt-3.5-turbo"],
  },
];

export const resolveModel = (profileId: ModelCapability, availableModels: string[] = []) => {
  const profile = MODEL_ROUTES.find((route) => route.id === profileId) ?? MODEL_ROUTES[0];
  const candidates = [profile.defaultModel, ...profile.fallbacks];
  const supported = candidates.find((candidate) => availableModels.includes(candidate));
  return {
    profile,
    model: supported ?? profile.defaultModel,
    downgraded: Boolean(!supported && availableModels.length > 0),
  };
};
