"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "../../../../components/GlassCard";
import { MetricPills } from "../../../../components/MetricPills";
import { TokenCostBar } from "../../../../components/TokenCostBar";
import { ModelRouter } from "../../../../components/ModelRouter";
import { KeyGuard } from "../../../../components/KeyGuard";
import { useSettingsStore } from "../../../../lib/state/settings";
import { useProgressStore } from "../../../../lib/state/progress";
import { streamOpenAIChat } from "../../../../lib/api/clients";
import { estimateCost } from "../../../../lib/utils/cost";

interface RunSnapshot {
  text: string;
  metrics: {
    promptTokens: number;
    completionTokens: number;
    cost: number;
    latencyMs: number;
  };
}

export default function PromptOpsLab() {
  const hydrate = useSettingsStore((state) => state.hydrate);
  const openaiKey = useSettingsStore((state) => state.decryptedKeys.openai);
  const addRun = useProgressStore((state) => state.addRun);
  const recordChallenge = useProgressStore((state) => state.recordChallenge);
  const refreshBadges = useProgressStore((state) => state.refreshBadges);
  const incrementMetric = useProgressStore((state) => state.incrementMetric);
  const [baselinePrompt, setBaselinePrompt] = useState(
    "Write a concise executive summary of this policy update with bullet highlights and risk callouts."
  );
  const [variantPrompt, setVariantPrompt] = useState(
    "Summarize the policy update for executives. Use three bullet points, call out risks, and end with a recommended action in one sentence."
  );
  const [context, setContext] = useState(
    "Policy update: New AI usage guidelines require human review for financial decisions, audit logging, and bias monitoring."
  );
  const [model, setModel] = useState("openai:gpt-4o-mini");
  const [challengeMode, setChallengeMode] = useState(false);
  const [baseline, setBaseline] = useState<RunSnapshot | null>(null);
  const [variant, setVariant] = useState<RunSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const runComparisons = async () => {
    if (!openaiKey) {
      setMessage("OpenAI key required.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const base = await runPrompt(baselinePrompt, openaiKey);
      const variantResult = await runPrompt(variantPrompt, openaiKey);
      setBaseline(base);
      setVariant(variantResult);
      addRun({
        id: crypto.randomUUID(),
        lab: "prompt-ops",
        model,
        promptTokens: base.metrics.promptTokens + variantResult.metrics.promptTokens,
        completionTokens: base.metrics.completionTokens + variantResult.metrics.completionTokens,
        cost: base.metrics.cost + variantResult.metrics.cost,
        latencyMs: base.metrics.latencyMs + variantResult.metrics.latencyMs,
        timestamp: Date.now(),
        outputPreview: `${base.text}\n---\n${variantResult.text}`,
        metadata: { baselinePrompt, variantPrompt },
      });
      incrementMetric("promptVariantsTested");
      if (challengeMode) {
        const response = await fetch("/api/score", {
          method: "POST",
          body: JSON.stringify({
            challengeId: "prompt-ops-optimizer",
            submission: {
              output: variantResult.text,
              cost: variantResult.metrics.cost,
              tokens: variantResult.metrics.promptTokens + variantResult.metrics.completionTokens,
              latencyMs: variantResult.metrics.latencyMs,
              metadata: {
                baselineCost: base.metrics.cost,
                readability: readabilityScore(variantResult.text),
              },
            },
          }),
        });
        if (response.ok) {
          const json = await response.json();
          recordChallenge("prompt-ops-optimizer", json.result.score, json.result.xp);
        }
      }
      refreshBadges();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const runPrompt = async (prompt: string, apiKey: string): Promise<RunSnapshot> => {
    let aggregated = "";
    const contextTokens = Math.round((context.length + prompt.length) / 4);
    const start = performance.now();
    const usage = await streamOpenAIChat({
      apiKey,
      model: model.replace("openai:", ""),
      url: "https://api.openai.com/v1/chat/completions",
      body: {
        messages: [
          { role: "system", content: "You optimize prompts and respond concisely." },
          { role: "user", content: `${context}\n---\n${prompt}` },
        ],
        temperature: 0.6,
      },
      callbacks: {
        onToken: (token) => {
          aggregated += token;
        },
      },
    });
    const latencyMs = performance.now() - start;
    const completionTokens = usage.completionTokens || Math.round(aggregated.length / 4);
    const breakdown = estimateCost(model, contextTokens, completionTokens);
    return {
      text: aggregated,
      metrics: {
        promptTokens: breakdown.promptTokens,
        completionTokens: breakdown.completionTokens,
        cost: breakdown.cost,
        latencyMs,
      },
    };
  };

  const optimizePrompt = () => {
    const shortened = variantPrompt
      .replace(/\bvery\b/gi, "")
      .replace(/\bplease\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    setVariantPrompt(shortened);
    setMessage("Variant prompt optimized for brevity.");
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/80">
        <h2 className="text-3xl font-semibold text-white">Prompt-Ops</h2>
        <p className="mt-3 max-w-3xl text-sm text-white/70">
          60-second brief: Run live A/B tests on prompts, compare cost vs. quality metrics, and ship the variant that meets executive constraints.
        </p>
        <label className="mt-6 inline-flex items-center gap-2 text-xs text-white/60">
          <input type="checkbox" checked={challengeMode} onChange={(event) => setChallengeMode(event.target.checked)} />
          Challenge mode: reduce cost by 30% while keeping readability ≥ 60
        </label>
      </section>
      <KeyGuard provider="openai">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)_280px]">
          <aside className="space-y-4">
            <GlassCard title="Context" accent="sky">
              <textarea
                className="h-32 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                value={context}
                onChange={(event) => setContext(event.target.value)}
              />
            </GlassCard>
            <GlassCard title="Prompts" accent="violet">
              <label className="block text-xs text-white/60">
                Baseline
                <textarea
                  className="mt-1 h-24 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                  value={baselinePrompt}
                  onChange={(event) => setBaselinePrompt(event.target.value)}
                />
              </label>
              <label className="mt-4 block text-xs text-white/60">
                Variant
                <textarea
                  className="mt-1 h-24 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                  value={variantPrompt}
                  onChange={(event) => setVariantPrompt(event.target.value)}
                />
              </label>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/20"
                  onClick={optimizePrompt}
                >
                  Optimize variant
                </button>
                <button
                  type="button"
                  className="rounded-full bg-sky-500/20 px-3 py-1 text-xs text-sky-100 hover:bg-sky-500/30"
                  onClick={runComparisons}
                  disabled={loading}
                >
                  {loading ? "Running..." : "Run A/B"}
                </button>
              </div>
              {message && <p className="mt-3 text-xs text-white/60">{message}</p>}
            </GlassCard>
          </aside>
          <section className="space-y-4">
            <GlassCard title="Baseline Output" accent="emerald">
              <pre className="max-h-[240px] overflow-auto rounded-2xl bg-slate-950/70 p-4 text-xs text-emerald-100">{baseline?.text}</pre>
            </GlassCard>
            <GlassCard title="Variant Output" accent="amber">
              <pre className="max-h-[240px] overflow-auto rounded-2xl bg-slate-950/70 p-4 text-xs text-amber-100">{variant?.text}</pre>
            </GlassCard>
          </section>
          <aside className="space-y-4">
            <ModelRouter profile="speed" availableModels={availableModels} value={model} onChange={setModel} />
            {baseline && (
              <GlassCard title="Baseline metrics" accent="sky">
                <MetricPills
                  tokensIn={baseline.metrics.promptTokens}
                  tokensOut={baseline.metrics.completionTokens}
                  cost={baseline.metrics.cost}
                  latencyMs={baseline.metrics.latencyMs}
                  model={model}
                />
                <div className="mt-3">
                  <TokenCostBar
                    breakdown={{
                      promptTokens: baseline.metrics.promptTokens,
                      completionTokens: baseline.metrics.completionTokens,
                      totalTokens: baseline.metrics.promptTokens + baseline.metrics.completionTokens,
                      cost: baseline.metrics.cost,
                    }}
                  />
                </div>
              </GlassCard>
            )}
            {variant && (
              <GlassCard title="Variant metrics" accent="emerald">
                <MetricPills
                  tokensIn={variant.metrics.promptTokens}
                  tokensOut={variant.metrics.completionTokens}
                  cost={variant.metrics.cost}
                  latencyMs={variant.metrics.latencyMs}
                  model={model}
                />
                <div className="mt-3">
                  <TokenCostBar
                    breakdown={{
                      promptTokens: variant.metrics.promptTokens,
                      completionTokens: variant.metrics.completionTokens,
                      totalTokens: variant.metrics.promptTokens + variant.metrics.completionTokens,
                      cost: variant.metrics.cost,
                    }}
                  />
                </div>
                {baseline && (
                  <p className="mt-3 text-xs text-white/60">
                    Cost delta: {((variant.metrics.cost - baseline.metrics.cost) / baseline.metrics.cost * 100).toFixed(1)}%
                  </p>
                )}
              </GlassCard>
            )}
          </aside>
        </div>
      </KeyGuard>
    </div>
  );
}

const availableModels = ["openai:gpt-4o-mini", "openai:gpt-3.5-turbo"];

const readabilityScore = (text: string) => {
  const sentences = text.split(/(?<=[.!?])/).filter(Boolean).length || 1;
  const words = text.split(/\s+/).filter(Boolean).length || 1;
  const syllables = Math.max(words * 1.3, words);
  const flesch = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.max(0, Math.min(100, flesch));
};
