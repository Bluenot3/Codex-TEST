"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyGuard } from "../../../../components/KeyGuard";
import { GlassCard } from "../../../../components/GlassCard";
import { MetricPills } from "../../../../components/MetricPills";
import { TokenCostBar } from "../../../../components/TokenCostBar";
import { ModelRouter } from "../../../../components/ModelRouter";
import { useSettingsStore } from "../../../../lib/state/settings";
import { useProgressStore } from "../../../../lib/state/progress";
import { estimateCost } from "../../../../lib/utils/cost";
import { formatDateTime } from "../../../../lib/utils/format";
import { streamOpenAIChat } from "../../../../lib/api/clients";

const availableModels = ["openai:gpt-4o-mini", "openai:gpt-4o", "openai:gpt-3.5-turbo"];

interface TraceEvent {
  type: "instruction" | "action" | "observation";
  label: string;
  detail: string;
}

export default function AgentForgeLab() {
  const hydrate = useSettingsStore((state) => state.hydrate);
  const openaiKey = useSettingsStore((state) => state.decryptedKeys.openai);
  const [model, setModel] = useState("openai:gpt-4o-mini");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are ZEN Vanguard Agent Forge. Extract structured insights with JSON responses."
  );
  const [userPrompt, setUserPrompt] = useState("Summarize the attached briefing and extract key metrics.");
  const [temperature, setTemperature] = useState(0.2);
  const [reasoning, setReasoning] = useState(true);
  const [tools, setTools] = useState<string[]>(["calculator"]);
  const [response, setResponse] = useState("");
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({ tokensIn: 0, tokensOut: 0, cost: 0, latency: 0 });
  const [challengeMode, setChallengeMode] = useState(false);
  const addRun = useProgressStore((state) => state.addRun);
  const recordChallenge = useProgressStore((state) => state.recordChallenge);
  const refreshBadges = useProgressStore((state) => state.refreshBadges);
  const incrementMetric = useProgressStore((state) => state.incrementMetric);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const reasoningTimeline = useMemo(() => {
    if (!response) return [] as TraceEvent[];
    if (trace.length) return trace;
    const synthetic: TraceEvent[] = [
      {
        type: "instruction",
        label: "System",
        detail: systemPrompt.slice(0, 140),
      },
      {
        type: "action",
        label: "Analyzer",
        detail: `Tools engaged: ${tools.join(", ") || "none"}`,
      },
      {
        type: "observation",
        label: "Response",
        detail: response.slice(0, 140),
      },
    ];
    setTrace(synthetic);
    return synthetic;
  }, [response, trace, systemPrompt, tools]);

  const runAgent = async () => {
    if (!openaiKey) {
      setError("OpenAI key required.");
      return;
    }
    setLoading(true);
    setResponse("");
    setError(null);
    setTrace([]);
    const start = performance.now();
    const promptTokens = Math.round((systemPrompt.length + userPrompt.length) / 4);
    try {
      let aggregated = "";
      const usage = await streamOpenAIChat({
        apiKey: openaiKey,
        model: model.replace("openai:", ""),
        url: "https://api.openai.com/v1/chat/completions",
        body: {
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `${userPrompt}\nTools available: ${tools.join(", ") || "none"}. Provide JSON and short summary.`,
            },
          ],
          temperature,
          response_format: { type: "json_schema", json_schema: { name: "agent_payload", schema: agentSchema } },
        },
        callbacks: {
          onToken: (token) => {
            aggregated += token;
            setResponse((prev) => prev + token);
          },
        },
      });
      const latency = performance.now() - start;
      const completionTokens = usage.completionTokens || Math.round(aggregated.length / 4);
      const breakdown = estimateCost(model, promptTokens, completionTokens);
      setMetrics({ tokensIn: breakdown.promptTokens, tokensOut: breakdown.completionTokens, cost: breakdown.cost, latency });
      const runId = crypto.randomUUID();
      addRun({
        id: runId,
        lab: "agent-forge",
        model,
        promptTokens: breakdown.promptTokens,
        completionTokens: breakdown.completionTokens,
        cost: breakdown.cost,
        latencyMs: latency,
        timestamp: Date.now(),
        outputPreview: aggregated,
        metadata: { streaming: true, reasoning },
      });
      incrementMetric("promptVariantsTested");
      if (challengeMode) {
        const res = await fetch("/api/score", {
          method: "POST",
          body: JSON.stringify({
            challengeId: "agent-forge-budget",
            submission: {
              output: aggregated,
              cost: breakdown.cost,
              tokens: breakdown.totalTokens,
              latencyMs: latency,
            },
          }),
        });
        if (res.ok) {
          const json = await res.json();
          recordChallenge("agent-forge-budget", json.result.score, json.result.xp);
        }
      }
      refreshBadges();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/80">
        <h2 className="text-3xl font-semibold text-white">Agent Forge</h2>
        <p className="mt-3 max-w-3xl text-sm text-white/70">
          60-second brief: Architect agents with structured prompts, tool routing, and reasoning visibility. Configure system instructions, enable tools, and inspect the action → observation timeline before shipping the agent to production.
        </p>
        <label className="mt-6 inline-flex items-center gap-2 text-xs text-white/60">
          <input type="checkbox" checked={challengeMode} onChange={(event) => setChallengeMode(event.target.checked)} />
          Challenge mode: extract structured data under $0.01
        </label>
      </section>
      <KeyGuard provider="openai">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)_280px]">
          <aside className="space-y-4">
            <GlassCard title="Agent Configuration" accent="sky">
              <label className="block space-y-2 text-xs text-white/70">
                <span>System instructions</span>
                <textarea
                  className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                  value={systemPrompt}
                  onChange={(event) => setSystemPrompt(event.target.value)}
                />
              </label>
              <label className="block space-y-2 text-xs text-white/70">
                <span>User prompt</span>
                <textarea
                  className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                  value={userPrompt}
                  onChange={(event) => setUserPrompt(event.target.value)}
                />
              </label>
              <div className="grid gap-3">
                <label className="flex items-center justify-between text-xs text-white/70">
                  <span>Temperature</span>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={temperature}
                    onChange={(event) => setTemperature(Number(event.target.value))}
                    className="w-20 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-right text-sm text-white"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-white/70">
                  <input type="checkbox" checked={reasoning} onChange={(event) => setReasoning(event.target.checked)} />
                  Show reasoning trace
                </label>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-white/60">Tools</p>
                {toolOptions.map((tool) => (
                  <label key={tool.value} className="flex items-center gap-2 text-xs text-white/70">
                    <input
                      type="checkbox"
                      checked={tools.includes(tool.value)}
                      onChange={(event) => {
                        setTools((prev) =>
                          event.target.checked ? [...prev, tool.value] : prev.filter((item) => item !== tool.value)
                        );
                      }}
                    />
                    {tool.label}
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={runAgent}
                disabled={loading}
                className="mt-4 w-full rounded-full border border-sky-400/40 bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Running..." : "Deploy agent"}
              </button>
              {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
            </GlassCard>
          </aside>
          <section className="space-y-4">
            <GlassCard title="Reasoning Trace" accent="violet">
              <ul className="space-y-3 text-xs text-white/70">
                {reasoningTimeline.map((event, index) => (
                  <li key={`${event.type}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-white/40">{event.label}</p>
                    <p className="text-sm text-white">{event.detail}</p>
                  </li>
                ))}
              </ul>
            </GlassCard>
            <GlassCard title="Agent Output" accent="emerald">
              <pre className="max-h-[320px] overflow-auto rounded-2xl bg-slate-950/70 p-4 text-xs text-emerald-100">{response}</pre>
            </GlassCard>
          </section>
          <aside className="space-y-4">
            <ModelRouter profile="speed" availableModels={availableModels} value={model} onChange={setModel} />
            <GlassCard title="Run Metrics" accent="amber">
              <MetricPills
                tokensIn={metrics.tokensIn}
                tokensOut={metrics.tokensOut}
                cost={metrics.cost}
                latencyMs={metrics.latency}
                model={model}
              />
              <div className="mt-4">
                <TokenCostBar
                  breakdown={{
                    promptTokens: metrics.tokensIn,
                    completionTokens: metrics.tokensOut,
                    totalTokens: metrics.tokensIn + metrics.tokensOut,
                    cost: metrics.cost,
                  }}
                />
              </div>
              <p className="mt-4 text-[11px] uppercase tracking-widest text-white/50">
                Last refreshed {formatDateTime(new Date())}
              </p>
            </GlassCard>
          </aside>
        </div>
      </KeyGuard>
    </div>
  );
}

const toolOptions = [
  { value: "search", label: "Mock web search" },
  { value: "calculator", label: "Calculator" },
  { value: "memory", label: "Memory store" },
  { value: "structured", label: "Structured output" },
];

const agentSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    metrics: {
      type: "object",
      properties: {
        sentiment: { type: "string" },
        priority: { type: "string" },
      },
    },
  },
  required: ["summary"],
};
