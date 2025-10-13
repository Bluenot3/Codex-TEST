import { STORAGE_KEYS, XP_THRESHOLDS, RANK_LABELS } from "../constants";
import { createStore } from "./createStore";
import { BadgeContext, BADGE_DEFINITIONS, evaluateBadges } from "../gamify/badges";
import { SECTION_TWO_QUESTS } from "../gamify/quests";
import { formatRank } from "../utils/format";
import { isBrowser, safeJSONParse } from "../utils/guards";

export interface RunRecord {
  id: string;
  lab: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  latencyMs: number;
  timestamp: number;
  outputPreview: string;
  metadata?: Record<string, unknown>;
}

export interface ProgressSnapshot {
  xp: number;
  badges: string[];
  questsCompleted: string[];
  challengeScores: Record<string, number>;
  toolSchemasCreated: number;
  workflowsPublished: number;
  promptVariantsTested: number;
  visionAnalyses: number;
  ragSessions: number;
}

export interface ProgressState extends ProgressSnapshot {
  runs: RunRecord[];
  rank: { label: string; progress: number };
  addRun: (run: RunRecord) => void;
  awardXP: (amount: number) => void;
  completeQuest: (questId: string, xp: number) => void;
  recordChallenge: (challengeId: string, score: number, xp: number) => void;
  incrementMetric: (metric: keyof Omit<ProgressSnapshot, "xp" | "badges" | "questsCompleted" | "challengeScores">) => void;
  refreshBadges: () => void;
  resetProgress: () => void;
}

const defaultSnapshot = (): ProgressSnapshot => ({
  xp: 0,
  badges: [],
  questsCompleted: [],
  challengeScores: {},
  toolSchemasCreated: 0,
  workflowsPublished: 0,
  promptVariantsTested: 0,
  visionAnalyses: 0,
  ragSessions: 0,
});

const persistSnapshot = (snapshot: ProgressSnapshot) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(snapshot));
};

const persistRuns = (runs: RunRecord[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEYS.runHistory, JSON.stringify(runs));
};

const loadSnapshot = (): ProgressSnapshot => {
  if (!isBrowser()) return defaultSnapshot();
  const raw = window.localStorage.getItem(STORAGE_KEYS.progress);
  return { ...defaultSnapshot(), ...safeJSONParse<ProgressSnapshot | null>(raw, null) };
};

const loadRuns = (): RunRecord[] => {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEYS.runHistory);
  return safeJSONParse<RunRecord[]>(raw, []);
};

const computeBadgeContext = (state: ProgressState): BadgeContext => {
  const totalRuns = state.runs.length;
  const streamingRuns = state.runs.filter((run) => (run.metadata?.streaming as boolean | undefined) ?? true).length;
  const totalCost = state.runs.reduce((sum, run) => sum + run.cost, 0);
  return {
    totalRuns,
    streamingRuns,
    optimizedRuns: state.promptVariantsTested,
    totalCost,
    challengeCompletions: state.challengeScores,
    toolSchemasCreated: state.toolSchemasCreated,
    workflowsPublished: state.workflowsPublished,
    promptVariantsTested: state.promptVariantsTested,
    visionAnalyses: state.visionAnalyses,
    ragSessions: state.ragSessions,
  };
};

export const useProgressStore = createStore<ProgressState>((set, get) => {
  const snapshot = loadSnapshot();
  const runs = loadRuns();
  const rank = formatRank(snapshot.xp, XP_THRESHOLDS, RANK_LABELS);
  return {
    ...snapshot,
    runs,
    rank,
    addRun: (run) => {
      const nextRuns = [run, ...get().runs].slice(0, 50);
      set({ runs: nextRuns });
      persistRuns(nextRuns);
    },
    awardXP: (amount) => {
      const state = get();
      const nextXP = state.xp + amount;
      const rank = formatRank(nextXP, XP_THRESHOLDS, RANK_LABELS);
      set({ xp: nextXP, rank });
      persistSnapshot({
        xp: nextXP,
        badges: state.badges,
        questsCompleted: state.questsCompleted,
        challengeScores: state.challengeScores,
        toolSchemasCreated: state.toolSchemasCreated,
        workflowsPublished: state.workflowsPublished,
        promptVariantsTested: state.promptVariantsTested,
        visionAnalyses: state.visionAnalyses,
        ragSessions: state.ragSessions,
      });
    },
    completeQuest: (questId, xp) => {
      if (get().questsCompleted.includes(questId)) return;
      const state = get();
      const questsCompleted = [...state.questsCompleted, questId];
      const xpGain = state.xp + xp;
      const rank = formatRank(xpGain, XP_THRESHOLDS, RANK_LABELS);
      set({ questsCompleted, xp: xpGain, rank });
      persistSnapshot({
        xp: xpGain,
        badges: state.badges,
        questsCompleted,
        challengeScores: state.challengeScores,
        toolSchemasCreated: state.toolSchemasCreated,
        workflowsPublished: state.workflowsPublished,
        promptVariantsTested: state.promptVariantsTested,
        visionAnalyses: state.visionAnalyses,
        ragSessions: state.ragSessions,
      });
    },
    recordChallenge: (challengeId, score, xp) => {
      const state = get();
      const challengeScores = { ...state.challengeScores, [challengeId]: score };
      const xpGain = state.xp + xp;
      const rank = formatRank(xpGain, XP_THRESHOLDS, RANK_LABELS);
      set({ challengeScores, xp: xpGain, rank });
      persistSnapshot({
        xp: xpGain,
        badges: state.badges,
        questsCompleted: state.questsCompleted,
        challengeScores,
        toolSchemasCreated: state.toolSchemasCreated,
        workflowsPublished: state.workflowsPublished,
        promptVariantsTested: state.promptVariantsTested,
        visionAnalyses: state.visionAnalyses,
        ragSessions: state.ragSessions,
      });
    },
    incrementMetric: (metric) => {
      const state = get();
      const nextValue = (state[metric] as number) + 1;
      set({ [metric]: nextValue } as Partial<ProgressState>);
      persistSnapshot({
        xp: state.xp,
        badges: state.badges,
        questsCompleted: state.questsCompleted,
        challengeScores: state.challengeScores,
        toolSchemasCreated:
          metric === "toolSchemasCreated" ? nextValue : state.toolSchemasCreated,
        workflowsPublished:
          metric === "workflowsPublished" ? nextValue : state.workflowsPublished,
        promptVariantsTested:
          metric === "promptVariantsTested" ? nextValue : state.promptVariantsTested,
        visionAnalyses: metric === "visionAnalyses" ? nextValue : state.visionAnalyses,
        ragSessions: metric === "ragSessions" ? nextValue : state.ragSessions,
      });
    },
    refreshBadges: () => {
      const state = get();
      const context = computeBadgeContext(state);
      const badges = evaluateBadges(context);
      const newBadges = badges.filter((id) => !state.badges.includes(id));
      if (!newBadges.length && badges.length === state.badges.length) return;
      let xpGain = state.xp;
      for (const badgeId of newBadges) {
        const badge = BADGE_DEFINITIONS.find((item) => item.id === badgeId);
        if (badge) xpGain += badge.xp;
      }
      const rank = formatRank(xpGain, XP_THRESHOLDS, RANK_LABELS);
      set({ badges, xp: xpGain, rank });
      persistSnapshot({
        xp: xpGain,
        badges,
        questsCompleted: state.questsCompleted,
        challengeScores: state.challengeScores,
        toolSchemasCreated: state.toolSchemasCreated,
        workflowsPublished: state.workflowsPublished,
        promptVariantsTested: state.promptVariantsTested,
        visionAnalyses: state.visionAnalyses,
        ragSessions: state.ragSessions,
      });
    },
    resetProgress: () => {
      const defaults = defaultSnapshot();
      persistSnapshot(defaults);
      persistRuns([]);
      set({ ...defaults, runs: [], rank: formatRank(0, XP_THRESHOLDS, RANK_LABELS) });
    },
  };
});

export const questById = (id: string) => SECTION_TWO_QUESTS.find((quest) => quest.id === id);
