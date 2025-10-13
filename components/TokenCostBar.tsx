import { CostBreakdown } from "../lib/utils/cost";
import { formatCurrency, formatTokens } from "../lib/utils/format";

interface TokenCostBarProps {
  breakdown: CostBreakdown;
}

export const TokenCostBar = ({ breakdown }: TokenCostBarProps) => {
  const total = breakdown.promptTokens + breakdown.completionTokens;
  const promptRatio = total ? (breakdown.promptTokens / total) * 100 : 50;

  return (
    <div className="space-y-2 text-xs text-white/70">
      <div className="flex items-center justify-between">
        <span>Token Mix</span>
        <span>{formatCurrency(breakdown.cost, 5)}</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-sky-400/80 transition-[width]"
          style={{ width: `${promptRatio}%` }}
          aria-label="Prompt tokens"
        />
        <div
          className="h-full bg-purple-400/80 transition-[width]"
          style={{ width: `${100 - promptRatio}%` }}
          aria-label="Completion tokens"
        />
      </div>
      <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-white/50">
        <span>{formatTokens(breakdown.promptTokens)} prompt</span>
        <span>{formatTokens(breakdown.completionTokens)} completion</span>
      </div>
    </div>
  );
};
