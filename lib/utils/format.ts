export const formatCurrency = (value: number, digits = 4) =>
  `$${value.toFixed(digits)}`;

export const formatTokens = (tokens: number) => `${Math.round(tokens).toLocaleString()} tok`;

export const formatDuration = (ms: number) => {
  if (!Number.isFinite(ms)) return "–";
  if (ms < 1000) return `${ms.toFixed(0)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${(ms / 60_000).toFixed(1)} min`;
};

export const formatDateTime = (date: Date) =>
  date.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "2-digit",
  });

export const formatPercentage = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;

export const formatRank = (xp: number, thresholds: number[], labels: string[]) => {
  const idx = thresholds.reduce((acc, threshold, index) => (xp >= threshold ? index : acc), 0);
  const next = thresholds[idx + 1];
  const progress = next ? (xp - thresholds[idx]) / (next - thresholds[idx]) : 1;
  return {
    label: labels[idx] ?? labels.at(-1) ?? "Vanguard",
    progress,
  };
};
