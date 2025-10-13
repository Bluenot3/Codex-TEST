"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "../../../../components/GlassCard";
import { MetricPills } from "../../../../components/MetricPills";
import { TokenCostBar } from "../../../../components/TokenCostBar";
import { KeyGuard } from "../../../../components/KeyGuard";
import { useProgressStore } from "../../../../lib/state/progress";
import { estimateCost } from "../../../../lib/utils/cost";

interface Chunk {
  id: string;
  content: string;
  score: number;
}

const documents = [
  {
    id: "charter",
    title: "ZEN Vanguard Charter",
    body: "ZEN Vanguard equips executives to orchestrate advanced AI responsibly. Module 2 focuses on telemetry, cost visibility, and agentic control.",
  },
  {
    id: "playbook",
    title: "AI Governance Playbook",
    body: "Key pillars: secure key handling, transparent logging, multi-provider routing, and bias mitigation. Always record prompts, latency, and token usage.",
  },
  {
    id: "case-study",
    title: "Case Study",
    body: "A Fortune 200 firm reduced AI spend by 32% by implementing prompt experiments, telemetry dashboards, and workflow reviews across the org.",
  },
];

export default function DataBrokerLab() {
  const [query, setQuery] = useState("How do we reduce AI cost while improving oversight?");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [answer, setAnswer] = useState("");
  const [challengeMode, setChallengeMode] = useState(false);
  const addRun = useProgressStore((state) => state.addRun);
  const recordChallenge = useProgressStore((state) => state.recordChallenge);
  const incrementMetric = useProgressStore((state) => state.incrementMetric);
  const refreshBadges = useProgressStore((state) => state.refreshBadges);

  const metrics = useMemo(() => {
    const promptTokens = Math.round(query.length / 4) + 80;
    const completionTokens = Math.round(answer.length / 4);
    return estimateCost("openai:gpt-4o-mini", promptTokens, completionTokens || 120);
  }, [query, answer]);

  const ingestDocs = () => {
    const processed = documents.flatMap((doc) =>
      chunkDocument(doc.body).map((chunk, index) => ({
        id: `${doc.id}-${index}`,
        content: chunk,
        score: 0,
      }))
    );
    setChunks(processed);
    setAnswer("");
  };

  const runQuery = () => {
    if (!chunks.length) {
      ingestDocs();
    }
    const scored = chunks
      .map((chunk) => ({
        ...chunk,
        score: similarity(query, chunk.content),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    setChunks(scored);
    const response = composeAnswer(query, scored);
    setAnswer(response);
    addRun({
      id: crypto.randomUUID(),
      lab: "data-broker",
      model: "rag-simulator",
      promptTokens: metrics.promptTokens,
      completionTokens: metrics.completionTokens,
      cost: metrics.cost,
      latencyMs: 900,
      timestamp: Date.now(),
      outputPreview: response,
      metadata: { citations: scored.map((chunk) => chunk.id) },
    });
    incrementMetric("ragSessions");
    if (challengeMode) {
      fetch("/api/score", {
        method: "POST",
        body: JSON.stringify({
          challengeId: "data-broker-accuracy",
          submission: {
            output: response,
            cost: metrics.cost,
            tokens: metrics.totalTokens,
            latencyMs: 900,
            metadata: { accuracy: scored[0]?.score ?? 0, citations: scored.length },
          },
        }),
      })
        .then((res) => res.json())
        .then((json) => recordChallenge("data-broker-accuracy", json.result.score, json.result.xp));
    }
    refreshBadges();
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/80">
        <h2 className="text-3xl font-semibold text-white">Data Broker</h2>
        <p className="mt-3 max-w-3xl text-sm text-white/70">
          60-second brief: Ingest documents, embed chunks, and answer executive questions with citations and confidence scores.
        </p>
        <label className="mt-6 inline-flex items-center gap-2 text-xs text-white/60">
          <input type="checkbox" checked={challengeMode} onChange={(event) => setChallengeMode(event.target.checked)} />
          Challenge mode: maintain ≥0.8 accuracy with cost guardrails
        </label>
      </section>
      <KeyGuard provider="openai">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)_280px]">
          <aside className="space-y-4">
            <GlassCard title="Query" accent="sky">
              <textarea
                className="h-32 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/20"
                  onClick={ingestDocs}
                >
                  Ingest sample docs
                </button>
                <button
                  type="button"
                  className="rounded-full bg-sky-500/20 px-3 py-1 text-xs text-sky-100 hover:bg-sky-500/30"
                  onClick={runQuery}
                >
                  Retrieve + answer
                </button>
              </div>
            </GlassCard>
            <GlassCard title="Retrieved Chunks" accent="violet">
              <ul className="space-y-3 text-xs text-white/80">
                {chunks.map((chunk) => (
                  <li key={chunk.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] uppercase tracking-widest text-white/40">Score {(chunk.score * 100).toFixed(1)}%</p>
                    <p>{chunk.content}</p>
                    <p className="mt-2 text-[10px] text-white/50">{chunk.id}</p>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </aside>
          <section className="space-y-4">
            <GlassCard title="Answer" accent="emerald">
              <pre className="max-h-[420px] overflow-auto rounded-2xl bg-slate-950/70 p-4 text-xs text-emerald-100">{answer}</pre>
            </GlassCard>
          </section>
          <aside className="space-y-4">
            <GlassCard title="Metrics" accent="amber">
              <MetricPills
                tokensIn={metrics.promptTokens}
                tokensOut={metrics.completionTokens}
                cost={metrics.cost}
                latencyMs={900}
                model="rag-simulator"
              />
              <div className="mt-3">
                <TokenCostBar breakdown={metrics} />
              </div>
            </GlassCard>
          </aside>
        </div>
      </KeyGuard>
    </div>
  );
}

const chunkDocument = (text: string) => {
  const sentences = text.split(/(?<=[.!?])/).filter(Boolean);
  const chunks: string[] = [];
  let buffer = "";
  for (const sentence of sentences) {
    const tentative = `${buffer} ${sentence}`.trim();
    if (tentative.length > 180) {
      chunks.push(buffer.trim());
      buffer = sentence;
    } else {
      buffer = tentative;
    }
  }
  if (buffer) chunks.push(buffer.trim());
  return chunks;
};

const similarity = (query: string, chunk: string) => {
  const queryTerms = new Set(query.toLowerCase().split(/\W+/).filter(Boolean));
  const chunkTerms = new Set(chunk.toLowerCase().split(/\W+/).filter(Boolean));
  let match = 0;
  queryTerms.forEach((term) => {
    if (chunkTerms.has(term)) match += 1;
  });
  return match / Math.max(1, queryTerms.size);
};

const composeAnswer = (query: string, chunks: Chunk[]) => {
  const bulletPoints = chunks.map((chunk) => `- ${chunk.content}`);
  return `Query: ${query}\nRecommendations:\n${bulletPoints.join("\n")}\n\nSources: ${chunks
    .map((chunk) => chunk.id)
    .join(", ")}`;
};
