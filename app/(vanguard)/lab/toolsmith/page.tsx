"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "../../../../components/GlassCard";
import { MetricPills } from "../../../../components/MetricPills";
import { ModelRouter } from "../../../../components/ModelRouter";
import { TokenCostBar } from "../../../../components/TokenCostBar";
import { KeyGuard } from "../../../../components/KeyGuard";
import { useSettingsStore } from "../../../../lib/state/settings";
import { useProgressStore } from "../../../../lib/state/progress";
import { estimateCost } from "../../../../lib/utils/cost";
import { streamOpenAIChat } from "../../../../lib/api/clients";

const samplePosting = `Lead AI Engineer at Aurora Labs\nLocation: Remote (US)\nCompensation: $220k + equity\nResponsibilities:\n- Partner with product to scope AI-enabled workflows\n- Build toolchains for retrieval, ranking, and autonomous agents\n- Mentor a 6-person applied ML team\nPreferred Skills:\n- 6+ years with Python and JS\n- Experience with LangChain, LlamaIndex, or custom orchestration\n- Track record shipping enterprise AI systems`; 

const starterSchema = `{
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "company": { "type": "string" },
    "compensation": { "type": "string" },
    "responsibilities": { "type": "array", "items": { "type": "string" } },
    "skills": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["title", "company", "responsibilities"]
}`;

export default function ToolsmithLab() {
  const hydrate = useSettingsStore((state) => state.hydrate);
  const openaiKey = useSettingsStore((state) => state.decryptedKeys.openai);
  const addRun = useProgressStore((state) => state.addRun);
  const incrementMetric = useProgressStore((state) => state.incrementMetric);
  const recordChallenge = useProgressStore((state) => state.recordChallenge);
  const refreshBadges = useProgressStore((state) => state.refreshBadges);
  const [schema, setSchema] = useState(starterSchema);
  const [challengeMode, setChallengeMode] = useState(false);
  const [model, setModel] = useState("openai:gpt-4o-mini");
  const [result, setResult] = useState("");
  const [metrics, setMetrics] = useState({ tokensIn: 0, tokensOut: 0, cost: 0, latency: 0 });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const validateSchema = () => {
    try {
      const parsed = JSON.parse(schema);
      const required = parsed.required ?? [];
      const props = parsed.properties ?? {};
      const missing = required.filter((key: string) => !props[key]);
      if (missing.length) {
        setMessage(`Missing definitions for required fields: ${missing.join(", ")}`);
        return false;
      }
      setMessage("Schema valid.");
      return true;
    } catch (error) {
      setMessage("Schema is not valid JSON.");
      return false;
    }
  };

  const simulateToolCall = async () => {
    if (!openaiKey) {
      setMessage("OpenAI key required.");
      return;
    }
    if (!validateSchema()) return;
    setLoading(true);
    setResult("");
    setMessage(null);
    const start = performance.now();
    const promptTokens = Math.round((schema.length + samplePosting.length) / 4);
    let aggregated = "";
    try {
      const usage = await streamOpenAIChat({
        apiKey: openaiKey,
        model: model.replace("openai:", ""),
        url: "https://api.openai.com/v1/chat/completions",
        body: {
          temperature: 0,
          messages: [
            {
              role: "system",
              content:
                "You convert unstructured job postings into JSON matching a provided schema. Respond with raw JSON only.",
            },
            {
              role: "user",
              content: `Schema:\n${schema}\n---\nPosting:\n${samplePosting}`,
            },
          ],
        },
        callbacks: {
          onToken: (token) => {
            aggregated += token;
            setResult((prev) => prev + token);
          },
        },
      });
      const latency = performance.now() - start;
      const completionTokens = usage.completionTokens || Math.round(aggregated.length / 4);
      const breakdown = estimateCost(model, promptTokens, completionTokens);
      setMetrics({ tokensIn: breakdown.promptTokens, tokensOut: breakdown.completionTokens, cost: breakdown.cost, latency });
      addRun({
        id: crypto.randomUUID(),
        lab: "toolsmith",
        model,
        promptTokens: breakdown.promptTokens,
        completionTokens: breakdown.completionTokens,
        cost: breakdown.cost,
        latencyMs: latency,
        timestamp: Date.now(),
        outputPreview: aggregated,
        metadata: { schema },
      });
      incrementMetric("toolSchemasCreated");
      if (challengeMode) {
        const response = await fetch("/api/score", {
          method: "POST",
          body: JSON.stringify({
            challengeId: "toolsmith-ats",
            submission: {
              output: aggregated,
              cost: breakdown.cost,
              tokens: breakdown.totalTokens,
              latencyMs: latency,
            },
          }),
        });
        if (response.ok) {
          const json = await response.json();
          recordChallenge("toolsmith-ats", json.result.score, json.result.xp);
        }
      }
      refreshBadges();
      setMessage("Tool call simulated.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/80">
        <h2 className="text-3xl font-semibold text-white">Toolsmith</h2>
        <p className="mt-3 max-w-3xl text-sm text-white/70">
          60-second brief: Define bulletproof tool schemas and validate outputs before integrating with production agents. Map required fields, enforce types, and simulate calls against canonical job postings.
        </p>
        <label className="mt-6 inline-flex items-center gap-2 text-xs text-white/60">
          <input type="checkbox" checked={challengeMode} onChange={(event) => setChallengeMode(event.target.checked)} />
          Challenge mode: Build ATS-ready JSON schema
        </label>
      </section>
      <KeyGuard provider="openai">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)_280px]">
          <aside className="space-y-4">
            <GlassCard title="Schema" accent="violet">
              <textarea
                className="h-[360px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                value={schema}
                onChange={(event) => setSchema(event.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full bg-white/10 px-4 py-2 text-xs text-white/70 hover:bg-white/20"
                  onClick={validateSchema}
                >
                  Validate schema
                </button>
                <button
                  type="button"
                  className="rounded-full bg-sky-500/20 px-4 py-2 text-xs text-sky-100 hover:bg-sky-500/30"
                  onClick={simulateToolCall}
                  disabled={loading}
                >
                  {loading ? "Running..." : "Simulate call"}
                </button>
              </div>
              {message && <p className="mt-3 text-xs text-white/70">{message}</p>}
            </GlassCard>
            <GlassCard title="Sample Posting" accent="sky">
              <pre className="h-[200px] overflow-auto whitespace-pre-line rounded-2xl bg-slate-950/70 p-4 text-xs text-white/80">
                {samplePosting}
              </pre>
            </GlassCard>
          </aside>
          <section className="space-y-4">
            <GlassCard title="Generated JSON" accent="emerald">
              <pre className="max-h-[420px] overflow-auto rounded-2xl bg-slate-950/70 p-4 text-xs text-emerald-100">{result}</pre>
            </GlassCard>
          </section>
          <aside className="space-y-4">
            <ModelRouter profile="code" availableModels={availableModels} value={model} onChange={setModel} />
            <GlassCard title="Metrics" accent="amber">
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
            </GlassCard>
          </aside>
        </div>
      </KeyGuard>
    </div>
  );
}

const availableModels = ["openai:gpt-4o-mini", "openai:gpt-4o", "openai:gpt-3.5-turbo"];
