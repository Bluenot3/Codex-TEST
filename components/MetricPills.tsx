import { formatCurrency, formatDuration, formatTokens } from "../lib/utils/format";

export interface MetricPillProps {
  tokensIn: number;
  tokensOut: number;
  cost: number;
  latencyMs: number;
  model: string;
}

export const MetricPills = ({ tokensIn, tokensOut, cost, latencyMs, model }: MetricPillProps) => (
  <dl className="flex flex-wrap gap-2 text-xs text-white/80">
    <Metric label="Prompt" value={formatTokens(tokensIn)} />
    <Metric label="Completion" value={formatTokens(tokensOut)} />
    <Metric label="Cost" value={formatCurrency(cost, 5)} />
    <Metric label="Latency" value={formatDuration(latencyMs)} />
    <Metric label="Model" value={model} />
  </dl>
);

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1">
    <dt className="text-white/50">{label}</dt>
    <dd className="font-medium text-white">{value}</dd>
  </div>
);
