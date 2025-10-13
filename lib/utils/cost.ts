import { TOKEN_CPM_TABLE } from "../constants";

export type CostBreakdown = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
};

export const estimateCost = (
  model: string,
  promptTokens: number,
  completionTokens: number
): CostBreakdown => {
  const rate = TOKEN_CPM_TABLE[model] ?? TOKEN_CPM_TABLE["openai:gpt-4o-mini"];
  const promptCost = (promptTokens / 1000) * rate.prompt;
  const completionCost = (completionTokens / 1000) * rate.completion;
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    cost: Number((promptCost + completionCost).toFixed(6)),
  };
};

export const aggregateCosts = (runs: CostBreakdown[]) =>
  runs.reduce(
    (acc, run) => {
      acc.promptTokens += run.promptTokens;
      acc.completionTokens += run.completionTokens;
      acc.totalTokens += run.totalTokens;
      acc.cost = Number((acc.cost + run.cost).toFixed(6));
      return acc;
    },
    { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 }
  );
