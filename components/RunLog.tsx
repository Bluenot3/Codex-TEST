"use client";

import { useEffect, useMemo, useState } from "react";
import { useProgressStore, RunRecord } from "../lib/state/progress";
import { formatCurrency, formatDateTime, formatTokens, formatDuration } from "../lib/utils/format";

export const RunLog = () => {
  const runs = useProgressStore((state) => state.runs);
  const [selectedId, setSelectedId] = useState<string | null>(runs[0]?.id ?? null);

  useEffect(() => {
    if (!selectedId && runs[0]) {
      setSelectedId(runs[0].id);
    }
  }, [runs, selectedId]);

  const selectedRun = useMemo(() => runs.find((run) => run.id === selectedId) ?? runs[0], [runs, selectedId]);

  const handleExport = (run: RunRecord, type: "json" | "markdown") => {
    if (type === "json") {
      const blob = new Blob([JSON.stringify(run, null, 2)], { type: "application/json" });
      downloadBlob(blob, `zen-run-${run.id}.json`);
      return;
    }
    const markdown = `# ZEN Vanguard Run Report

- **Lab**: ${run.lab}
- **Timestamp**: ${new Date(run.timestamp).toISOString()}
- **Model**: ${run.model}
- **Tokens**: prompt ${run.promptTokens}, completion ${run.completionTokens}
- **Cost**: ${formatCurrency(run.cost)}
- **Latency**: ${formatDuration(run.latencyMs)}

## Output Preview

${run.outputPreview}
`;
    const blob = new Blob([markdown], { type: "text/markdown" });
    downloadBlob(blob, `zen-run-${run.id}.md`);
  };

  if (!runs.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        No runs yet. Complete a prompt to populate telemetry.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[240px_1fr]">
      <ul className="space-y-2 overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-4">
        {runs.map((run) => (
          <li key={run.id}>
            <button
              type="button"
              className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
                run.id === selectedRun?.id
                  ? "border-sky-400/40 bg-sky-500/15 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
              }`}
              onClick={() => setSelectedId(run.id)}
            >
              <p className="text-xs uppercase tracking-widest text-white/50">{run.lab}</p>
              <p className="text-sm font-medium text-white">{formatDateTime(new Date(run.timestamp))}</p>
              <p className="text-xs text-white/60">{run.model}</p>
            </button>
          </li>
        ))}
      </ul>
      {selectedRun && (
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/80">
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
            <span className="rounded-full bg-white/10 px-3 py-1">{selectedRun.model}</span>
            <span className="rounded-full bg-white/10 px-3 py-1">{formatTokens(selectedRun.promptTokens)} → {formatTokens(selectedRun.completionTokens)}</span>
            <span className="rounded-full bg-white/10 px-3 py-1">{formatCurrency(selectedRun.cost)}</span>
            <span className="rounded-full bg-white/10 px-3 py-1">{formatDuration(selectedRun.latencyMs)}</span>
          </div>
          <pre className="max-h-64 overflow-y-auto rounded-2xl bg-slate-950/70 p-4 text-xs text-white/80">
            {selectedRun.outputPreview}
          </pre>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full bg-sky-500/20 px-4 py-1.5 text-xs text-sky-100 hover:bg-sky-500/30"
              onClick={() => navigator.clipboard.writeText(selectedRun.outputPreview)}
            >
              Copy output
            </button>
            <button
              type="button"
              className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white/70 hover:bg-white/20"
              onClick={() => handleExport(selectedRun, "json")}
            >
              Export JSON
            </button>
            <button
              type="button"
              className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white/70 hover:bg-white/20"
              onClick={() => handleExport(selectedRun, "markdown")}
            >
              Export Markdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const downloadBlob = (blob: Blob, filename: string) => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 500);
};
