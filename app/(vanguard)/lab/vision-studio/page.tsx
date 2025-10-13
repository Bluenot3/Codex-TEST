"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "../../../../components/GlassCard";
import { FileDrop } from "../../../../components/FileDrop";
import { KeyGuard } from "../../../../components/KeyGuard";
import { MetricPills } from "../../../../components/MetricPills";
import { TokenCostBar } from "../../../../components/TokenCostBar";
import { useProgressStore } from "../../../../lib/state/progress";
import { estimateCost } from "../../../../lib/utils/cost";

interface RegionPrompt {
  id: string;
  label: string;
  prompt: string;
}

const seededItems = [
  { description: "AI Strategy Workshop", amount: 4800.0 },
  { description: "Executive Coaching", amount: 3200.0 },
  { description: "Telemetry Dashboard", amount: 1850.0 },
];

export default function VisionStudioLab() {
  const [imageSrc, setImageSrc] = useState("/logos/zen-vision.svg");
  const [regions, setRegions] = useState<RegionPrompt[]>([
    { id: crypto.randomUUID(), label: "Totals", prompt: "Extract invoice totals" },
    { id: crypto.randomUUID(), label: "Line items", prompt: "List each line item with amount." },
  ]);
  const [result, setResult] = useState("");
  const [challengeMode, setChallengeMode] = useState(false);
  const addRun = useProgressStore((state) => state.addRun);
  const recordChallenge = useProgressStore((state) => state.recordChallenge);
  const incrementMetric = useProgressStore((state) => state.incrementMetric);
  const refreshBadges = useProgressStore((state) => state.refreshBadges);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    refreshBadges();
  }, [result, refreshBadges]);

  const metrics = useMemo(() => {
    const promptTokens = Math.round(regions.reduce((sum, region) => sum + region.prompt.length, 0) / 4 + 80);
    const completionTokens = Math.round(result.length / 4);
    const breakdown = estimateCost("openai:gpt-4o-mini", promptTokens, completionTokens || 100);
    return breakdown;
  }, [regions, result]);

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const runExtraction = () => {
    const structured = {
      invoice: {
        vendor: "ZEN AI Co.",
        total: 9850,
        dueDate: "2024-03-31",
        currency: "USD",
      },
      items: seededItems,
      regions: regions.map((region) => ({ label: region.label, prompt: region.prompt })),
    };
    const json = JSON.stringify(structured, null, 2);
    setResult(json);
    addRun({
      id: crypto.randomUUID(),
      lab: "vision-studio",
      model: "vision-simulator",
      promptTokens: metrics.promptTokens,
      completionTokens: metrics.completionTokens,
      cost: metrics.cost,
      latencyMs: 1400,
      timestamp: Date.now(),
      outputPreview: json,
      metadata: { regions: regions.length },
    });
    incrementMetric("visionAnalyses");
    if (challengeMode) {
      fetch("/api/score", {
        method: "POST",
        body: JSON.stringify({
          challengeId: "vision-invoice",
          submission: {
            output: json,
            cost: metrics.cost,
            tokens: metrics.totalTokens,
            latencyMs: 1400,
          },
        }),
      })
        .then((res) => res.json())
        .then((json) => recordChallenge("vision-invoice", json.result.score, json.result.xp));
    }
    setMessage("Structured JSON generated from image cues.");
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/80">
        <h2 className="text-3xl font-semibold text-white">Vision Studio</h2>
        <p className="mt-3 max-w-3xl text-sm text-white/70">
          60-second brief: Upload screenshots or invoices, define region prompts, and extract structured JSON ready for downstream automations.
        </p>
        <label className="mt-6 inline-flex items-center gap-2 text-xs text-white/60">
          <input type="checkbox" checked={challengeMode} onChange={(event) => setChallengeMode(event.target.checked)} />
          Challenge mode: capture totals and line items accurately
        </label>
      </section>
      <KeyGuard provider="openai">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)_280px]">
          <aside className="space-y-4">
            <GlassCard title="Source Image" accent="sky">
              <FileDrop onFiles={handleFiles} accept="image/*">
                <p className="text-xs text-white/60">Drop an image or click to upload.</p>
              </FileDrop>
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                <Image src={imageSrc} alt="Vision sample" width={280} height={180} className="h-auto w-full" />
              </div>
            </GlassCard>
            <GlassCard title="Region Prompts" accent="violet">
              <ul className="space-y-3 text-xs text-white/80">
                {regions.map((region) => (
                  <li key={region.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{region.label}</span>
                      <button
                        type="button"
                        className="text-xs text-white/60 hover:text-rose-300"
                        onClick={() => setRegions((prev) => prev.filter((item) => item.id !== region.id))}
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-sky-400 focus:outline-none"
                      value={region.prompt}
                      onChange={(event) =>
                        setRegions((prev) =>
                          prev.map((item) => (item.id === region.id ? { ...item, prompt: event.target.value } : item))
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-3 w-full rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/20"
                onClick={() => setRegions((prev) => [...prev, { id: crypto.randomUUID(), label: "New region", prompt: "" }])}
              >
                Add region prompt
              </button>
            </GlassCard>
          </aside>
          <section className="space-y-4">
            <GlassCard title="Structured JSON" accent="emerald">
              <pre className="max-h-[440px] overflow-auto rounded-2xl bg-slate-950/70 p-4 text-xs text-emerald-100">{result}</pre>
            </GlassCard>
            {message && <p className="text-xs text-white/60">{message}</p>}
            <button
              type="button"
              className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/30"
              onClick={runExtraction}
            >
              Extract data
            </button>
          </section>
          <aside className="space-y-4">
            <GlassCard title="Metrics" accent="amber">
              <MetricPills
                tokensIn={metrics.promptTokens}
                tokensOut={metrics.completionTokens}
                cost={metrics.cost}
                latencyMs={1400}
                model="vision-simulator"
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
