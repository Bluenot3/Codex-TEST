export interface BadgeContext {
  totalRuns: number;
  streamingRuns: number;
  optimizedRuns: number;
  totalCost: number;
  challengeCompletions: Record<string, number>;
  toolSchemasCreated: number;
  workflowsPublished: number;
  promptVariantsTested: number;
  visionAnalyses: number;
  ragSessions: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  xp: number;
  icon: string;
  criteria: (context: BadgeContext) => boolean;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "stream-init",
    name: "Stream Initiate",
    description: "Complete your first streaming completion in any lab.",
    xp: 50,
    icon: "/badges/stream-init.svg",
    criteria: (ctx) => ctx.streamingRuns >= 1,
  },
  {
    id: "budget-keeper",
    name: "Budget Keeper",
    description: "Keep total spend under $0.02 across five runs.",
    xp: 80,
    icon: "/badges/budget-keeper.svg",
    criteria: (ctx) => ctx.totalRuns >= 5 && ctx.totalCost <= 0.02,
  },
  {
    id: "schema-smith",
    name: "Schema Smith",
    description: "Author three validated tool schemas in Toolsmith.",
    xp: 120,
    icon: "/badges/schema-smith.svg",
    criteria: (ctx) => ctx.toolSchemasCreated >= 3,
  },
  {
    id: "workflow-weaver",
    name: "Workflow Weaver",
    description: "Publish two workflow canvases with branch logic.",
    xp: 140,
    icon: "/badges/workflow-weaver.svg",
    criteria: (ctx) => ctx.workflowsPublished >= 2,
  },
  {
    id: "prompt-alchemist",
    name: "Prompt Alchemist",
    description: "Test at least three prompt variants in Prompt-Ops.",
    xp: 110,
    icon: "/badges/prompt-alchemist.svg",
    criteria: (ctx) => ctx.promptVariantsTested >= 3,
  },
  {
    id: "visionary",
    name: "Visionary",
    description: "Complete a structured extraction in Vision Studio.",
    xp: 100,
    icon: "/badges/visionary.svg",
    criteria: (ctx) => ctx.visionAnalyses >= 1,
  },
  {
    id: "knowledge-broker",
    name: "Knowledge Broker",
    description: "Complete two retrieval answers with citations in Data Broker.",
    xp: 130,
    icon: "/badges/knowledge-broker.svg",
    criteria: (ctx) => ctx.ragSessions >= 2,
  },
  {
    id: "challenge-hunter",
    name: "Challenge Hunter",
    description: "Finish four unique Challenge Mode scenarios.",
    xp: 150,
    icon: "/badges/challenge-hunter.svg",
    criteria: (ctx) => Object.keys(ctx.challengeCompletions).length >= 4,
  },
  {
    id: "optimizer",
    name: "Optimizer",
    description: "Achieve a 30%+ cost reduction in Prompt-Ops.",
    xp: 90,
    icon: "/badges/optimizer.svg",
    criteria: (ctx) => ctx.optimizedRuns >= 1,
  },
  {
    id: "zen-vanguard",
    name: "ZEN Vanguard",
    description: "Complete every Section 2 quest node.",
    xp: 300,
    icon: "/badges/zen-vanguard.svg",
    criteria: (ctx) => ctx.challengeCompletions["section2-capstone"] === 1,
  },
  {
    id: "precisionist",
    name: "Precisionist",
    description: "Score ≥90 in any automated rubric.",
    xp: 110,
    icon: "/badges/precisionist.svg",
    criteria: (ctx) => Object.values(ctx.challengeCompletions).some((score) => score >= 90),
  },
];

export const evaluateBadges = (context: BadgeContext) =>
  BADGE_DEFINITIONS.filter((badge) => badge.criteria(context)).map((badge) => badge.id);
