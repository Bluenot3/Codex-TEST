export interface ChallengeSubmission {
  output: string;
  cost: number;
  tokens: number;
  latencyMs: number;
  metadata?: Record<string, unknown>;
}

export interface ChallengeScore {
  score: number;
  passed: boolean;
  breakdown: string[];
  xp: number;
}

export interface ChallengeDefinition {
  id: string;
  lab: string;
  title: string;
  description: string;
  rubric: (submission: ChallengeSubmission) => ChallengeScore;
}

const parseJSON = (value: string) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

export const CHALLENGES: ChallengeDefinition[] = [
  {
    id: "agent-forge-budget",
    lab: "agent-forge",
    title: "Structured Insight Under Budget",
    description: "Return structured fields while keeping cost < $0.01 and tokens < 400.",
    rubric: (submission) => {
      const breakdown: string[] = [];
      const parsed = parseJSON(submission.output);
      const hasFields = parsed && parsed.company && parsed.summary;
      if (hasFields) {
        breakdown.push("Structured JSON detected");
      } else {
        breakdown.push("Missing required structured fields");
      }
      const costScore = submission.cost < 0.01 ? 1 : Math.max(0, 1 - submission.cost * 50);
      const tokenScore = submission.tokens < 400 ? 1 : Math.max(0, 1 - (submission.tokens - 400) / 600);
      breakdown.push(`Cost: $${submission.cost.toFixed(4)}`);
      breakdown.push(`Tokens: ${submission.tokens}`);
      const accuracyScore = hasFields ? 1 : 0;
      const score = Math.round((accuracyScore * 0.6 + costScore * 0.2 + tokenScore * 0.2) * 100);
      return {
        score,
        passed: score >= 80,
        breakdown,
        xp: score >= 80 ? 220 : 90,
      };
    },
  },
  {
    id: "toolsmith-ats",
    lab: "toolsmith",
    title: "ATS Converter",
    description: "Design a schema that normalizes job postings into ATS-ready JSON.",
    rubric: (submission) => {
      const breakdown: string[] = [];
      const parsed = parseJSON(submission.output);
      const fields = parsed?.properties ?? {};
      const required = parsed?.required ?? [];
      const hasCore = ["title", "company", "location", "requirements"].every((key) => key in fields);
      breakdown.push(`Required fields present: ${hasCore ? "yes" : "no"}`);
      breakdown.push(`Required array length: ${required.length}`);
      const completeness = hasCore ? 1 : 0.4;
      const detailScore = Math.min(1, Object.keys(fields).length / 6);
      const score = Math.round((completeness * 0.6 + detailScore * 0.4) * 100);
      return {
        score,
        passed: score >= 85,
        breakdown,
        xp: score >= 85 ? 240 : 120,
      };
    },
  },
  {
    id: "workflow-speedrun",
    lab: "workflow-canvas",
    title: "Latency Speedrun",
    description: "Design a four-node workflow with end-to-end latency < 2000ms.",
    rubric: (submission) => {
      const breakdown: string[] = [];
      const meta = submission.metadata as { nodes?: number; latency?: number } | undefined;
      const nodeCount = meta?.nodes ?? 0;
      const latency = meta?.latency ?? submission.latencyMs;
      breakdown.push(`Nodes: ${nodeCount}`);
      breakdown.push(`Latency: ${latency.toFixed(0)}ms`);
      const nodeScore = nodeCount >= 4 ? 1 : nodeCount / 4;
      const latencyScore = latency <= 2000 ? 1 : Math.max(0, 1 - (latency - 2000) / 2000);
      const score = Math.round((nodeScore * 0.5 + latencyScore * 0.5) * 100);
      return {
        score,
        passed: score >= 90,
        breakdown,
        xp: score >= 90 ? 250 : 110,
      };
    },
  },
  {
    id: "prompt-ops-optimizer",
    lab: "prompt-ops",
    title: "Optimization Sprint",
    description: "Reduce token cost by 30% while meeting readability targets.",
    rubric: (submission) => {
      const meta = submission.metadata as { baselineCost?: number; readability?: number } | undefined;
      const baseline = meta?.baselineCost ?? submission.cost;
      const readability = meta?.readability ?? 0.7;
      const reduction = baseline ? 1 - submission.cost / baseline : 0;
      const reductionScore = reduction >= 0.3 ? 1 : Math.max(0, reduction / 0.3);
      const readabilityScore = readability >= 60 ? 1 : readability / 60;
      const score = Math.round((reductionScore * 0.7 + readabilityScore * 0.3) * 100);
      return {
        score,
        passed: score >= 85,
        breakdown: [
          `Baseline cost: $${baseline.toFixed(4)}`,
          `Run cost: $${submission.cost.toFixed(4)}`,
          `Reduction: ${(reduction * 100).toFixed(1)}%`,
          `Readability: ${readability.toFixed(1)}`,
        ],
        xp: score >= 85 ? 260 : 120,
      };
    },
  },
  {
    id: "vision-invoice",
    lab: "vision-studio",
    title: "Invoice Intelligence",
    description: "Extract line items and totals from the reference invoice.",
    rubric: (submission) => {
      const parsed = parseJSON(submission.output);
      const items = Array.isArray(parsed?.items) ? parsed.items.length : 0;
      const hasTotal = typeof parsed?.total === "number";
      const score = Math.round(((items >= 3 ? 1 : items / 3) * 0.6 + (hasTotal ? 1 : 0.3) * 0.4) * 100);
      return {
        score,
        passed: score >= 80,
        breakdown: [`Items extracted: ${items}`, `Total present: ${hasTotal ? "yes" : "no"}`],
        xp: score >= 80 ? 240 : 100,
      };
    },
  },
  {
    id: "data-broker-accuracy",
    lab: "data-broker",
    title: "Evidence-First Answers",
    description: "Answer questions using retrieved evidence with ≥0.8 accuracy and cite sources.",
    rubric: (submission) => {
      const meta = submission.metadata as { accuracy?: number; citations?: number } | undefined;
      const accuracy = meta?.accuracy ?? 0;
      const citations = meta?.citations ?? 0;
      const score = Math.round((Math.min(1, accuracy) * 0.7 + Math.min(1, citations / 2) * 0.3) * 100);
      return {
        score,
        passed: score >= 85,
        breakdown: [`Accuracy: ${(accuracy * 100).toFixed(1)}%`, `Citations: ${citations}`],
        xp: score >= 85 ? 280 : 130,
      };
    },
  },
];

export const evaluateChallenge = (id: string, submission: ChallengeSubmission) => {
  const challenge = CHALLENGES.find((item) => item.id === id);
  if (!challenge) throw new Error(`Unknown challenge: ${id}`);
  return challenge.rubric(submission);
};
