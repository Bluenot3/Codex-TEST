"use client";

export interface TelemetryMetrics {
  provider: string;
  model: string;
  modelLabel: string;
  tokensIn: number;
  tokensOut: number;
  costUSD: number;
  latencyMs?: number;
}

export function TelemetryOverlay({ metrics }: { metrics: TelemetryMetrics | null }) {
  return (
    <section className="rounded-2xl border border-sky-400/30 bg-sky-400/10 p-4 text-sky-50 shadow-inner">
      {metrics ? (
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-sky-100/70">Model</p>
            <p className="text-sm font-semibold text-sky-50">
              {metrics.modelLabel}
              <span className="ml-2 text-xs font-medium uppercase tracking-wide text-sky-100/60">
                {metrics.provider}
              </span>
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="space-y-1 rounded-xl bg-sky-400/10 p-3">
              <dt className="uppercase tracking-wide text-sky-100/60">Input tokens*</dt>
              <dd className="text-base font-semibold text-sky-50">{metrics.tokensIn}</dd>
            </div>
            <div className="space-y-1 rounded-xl bg-sky-400/10 p-3">
              <dt className="uppercase tracking-wide text-sky-100/60">Output tokens*</dt>
              <dd className="text-base font-semibold text-sky-50">{metrics.tokensOut}</dd>
            </div>
            <div className="space-y-1 rounded-xl bg-sky-400/10 p-3">
              <dt className="uppercase tracking-wide text-sky-100/60">Est. cost*</dt>
              <dd className="text-base font-semibold text-sky-50">${metrics.costUSD.toFixed(4)}</dd>
            </div>
            <div className="space-y-1 rounded-xl bg-sky-400/10 p-3">
              <dt className="uppercase tracking-wide text-sky-100/60">Latency</dt>
              <dd className="text-base font-semibold text-sky-50">
                {typeof metrics.latencyMs === "number" ? `${metrics.latencyMs}ms` : "--"}
              </dd>
            </div>
          </dl>
          <p className="text-[10px] leading-relaxed text-sky-100/60">
            *Token counts and costs are optimistic client-side estimates using a 4 char/token heuristic. Confirm against provider
            billing for production usage.
          </p>
        </div>
      ) : (
        <div className="text-xs text-sky-100/70">Telemetry appears after the first successful completion.</div>
      )}
    </section>
  );
}
