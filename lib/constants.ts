export const ZEN_APP_NAME = "ZEN Vanguard · Module 2";
export const STORAGE_KEYS = {
  secureKV: "zen.secure.kv",
  secureSalt: "zen.secure.salt",
  secureMaster: "zen.secure.master",
  settings: "zen.settings",
  progress: "zen.progress",
  runHistory: "zen.runs",
} as const;

export const DEFAULT_MODEL_PROFILE = "speed" as const;

export const TOKEN_CPM_TABLE: Record<string, { prompt: number; completion: number }> = {
  "openai:gpt-4o-mini": { prompt: 0.0005, completion: 0.0015 },
  "openai:gpt-4o": { prompt: 0.01, completion: 0.03 },
  "openai:gpt-3.5-turbo": { prompt: 0.0005, completion: 0.0015 },
  "anthropic:claude-3-sonnet": { prompt: 0.003, completion: 0.015 },
  "mistral:large": { prompt: 0.002, completion: 0.006 },
};

export const XP_THRESHOLDS = [0, 200, 500, 900, 1400, 2000, 2800, 3600];

export const RANK_LABELS = [
  "Initiate",
  "Pathfinder",
  "Architect",
  "Strategist",
  "Vanguard",
  "Luminary",
  "Oracle",
  "Legend",
];

export const SERVER_PROXY_FLAG = process.env.SERVER_PROXY ?? "disabled";
