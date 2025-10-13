export type QuestType = "teach" | "test";

export interface QuestNode {
  id: string;
  title: string;
  summary: string;
  xp: number;
  type: QuestType;
  prerequisites: string[];
  lab?: string;
}

export const SECTION_TWO_QUESTS: QuestNode[] = [
  {
    id: "welcome-brief",
    title: "Orientation Brief",
    summary: "Absorb the Section 2 overview and acknowledge the mission charter.",
    xp: 40,
    type: "teach",
    prerequisites: [],
  },
  {
    id: "settings-hardening",
    title: "Secure Your Keys",
    summary: "Encrypt and store at least one provider key in Settings.",
    xp: 80,
    type: "teach",
    prerequisites: ["welcome-brief"],
  },
  {
    id: "agent-forge-foundations",
    title: "Agent Forge Foundations",
    summary: "Craft a system prompt and route tasks with ModelRouter.",
    xp: 120,
    type: "teach",
    prerequisites: ["settings-hardening"],
    lab: "agent-forge",
  },
  {
    id: "agent-forge-challenge",
    title: "Budgeted Extraction",
    summary: "Complete the Agent Forge challenge under the cost ceiling.",
    xp: 180,
    type: "test",
    prerequisites: ["agent-forge-foundations"],
    lab: "agent-forge",
  },
  {
    id: "toolsmith-design",
    title: "Toolsmith Schematics",
    summary: "Design and validate two JSON tool schemas.",
    xp: 130,
    type: "teach",
    prerequisites: ["agent-forge-foundations"],
    lab: "toolsmith",
  },
  {
    id: "toolsmith-challenge",
    title: "ATS Converter",
    summary: "Deliver the job post extraction challenge with ≥0.8 F1.",
    xp: 200,
    type: "test",
    prerequisites: ["toolsmith-design"],
    lab: "toolsmith",
  },
  {
    id: "workflow-canvas-map",
    title: "Workflow Canvas Map",
    summary: "Sketch a branching workflow with latency annotations.",
    xp: 140,
    type: "teach",
    prerequisites: ["toolsmith-design"],
    lab: "workflow-canvas",
  },
  {
    id: "workflow-speedrun",
    title: "Latency Speedrun",
    summary: "Pass the Workflow Canvas challenge within 2s simulated SLA.",
    xp: 210,
    type: "test",
    prerequisites: ["workflow-canvas-map"],
    lab: "workflow-canvas",
  },
  {
    id: "prompt-ops-theory",
    title: "Prompt-Ops Theory",
    summary: "Run baseline vs. variant prompts and record deltas.",
    xp: 150,
    type: "teach",
    prerequisites: ["workflow-canvas-map"],
    lab: "prompt-ops",
  },
  {
    id: "prompt-ops-challenge",
    title: "Optimization Sprint",
    summary: "Achieve the 30% cost savings challenge.",
    xp: 220,
    type: "test",
    prerequisites: ["prompt-ops-theory"],
    lab: "prompt-ops",
  },
  {
    id: "vision-briefing",
    title: "Vision Ops Briefing",
    summary: "Load the reference invoice and configure regional prompts.",
    xp: 130,
    type: "teach",
    prerequisites: ["prompt-ops-theory"],
    lab: "vision-studio",
  },
  {
    id: "vision-challenge",
    title: "Invoice Intelligence",
    summary: "Complete the structured extraction challenge in Vision Studio.",
    xp: 210,
    type: "test",
    prerequisites: ["vision-briefing"],
    lab: "vision-studio",
  },
  {
    id: "rag-prep",
    title: "RAG Prep",
    summary: "Ingest the sample dossier and examine retrieved chunks.",
    xp: 150,
    type: "teach",
    prerequisites: ["vision-briefing"],
    lab: "data-broker",
  },
  {
    id: "rag-challenge",
    title: "Evidence-First Answers",
    summary: "Win the Data Broker challenge with accuracy ≥0.8.",
    xp: 240,
    type: "test",
    prerequisites: ["rag-prep"],
    lab: "data-broker",
  },
  {
    id: "telemetry-debrief",
    title: "Telemetry Debrief",
    summary: "Review run history trends and export a session report.",
    xp: 120,
    type: "teach",
    prerequisites: ["rag-prep"],
  },
  {
    id: "section2-capstone",
    title: "ZEN Vanguard Credential",
    summary: "Complete every Section 2 challenge and prepare to mint your credential.",
    xp: 400,
    type: "test",
    prerequisites: [
      "agent-forge-challenge",
      "toolsmith-challenge",
      "workflow-speedrun",
      "prompt-ops-challenge",
      "vision-challenge",
      "rag-challenge",
      "telemetry-debrief",
    ],
  },
];

export const nextAvailableQuests = (completed: Set<string>) =>
  SECTION_TWO_QUESTS.filter((quest) =>
    quest.prerequisites.every((id) => completed.has(id)) && !completed.has(quest.id)
  );
