"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "../../../../components/GlassCard";
import { useProgressStore } from "../../../../lib/state/progress";
import {
  buildDailyExecutionLoop,
  buildOpportunityPlan,
  FounderProfile,
  RiskLevel,
} from "../../../../lib/scoring/wealthPlanner";

const defaultProfile: FounderProfile = {
  hoursPerWeek: 12,
  monthlyCapital: 250,
  riskLevel: "balanced",
  targetMonthlyIncome: 5000,
  skillTags: ["automation", "ai", "sales"],
  existingAudience: 500,
  automationReadiness: 72,
};

const skillsCatalog = [
  "automation",
  "ai",
  "product",
  "sales",
  "operations",
  "research",
  "analytics",
  "design",
  "copywriting",
];

export default function WealthCompounderLab() {
  const [profile, setProfile] = useState(defaultProfile);
  const [ran, setRan] = useState(false);
  const addRun = useProgressStore((state) => state.addRun);

  const opportunities = useMemo(() => buildOpportunityPlan(profile), [profile]);
  const topOpportunity = opportunities[0];
  const loop = useMemo(
    () => (topOpportunity ? buildDailyExecutionLoop(profile, topOpportunity) : []),
    [profile, topOpportunity]
  );

  const runPlanner = () => {
    const start = performance.now();
    const outputPreview = opportunities
      .map((item, index) => `${index + 1}. ${item.name} (${item.score}/100)`)
      .join("\n");
    const latencyMs = performance.now() - start;

    addRun({
      id: crypto.randomUUID(),
      lab: "wealth-compounder",
      model: "local:compound-engine-v1",
      promptTokens: 0,
      completionTokens: 0,
      cost: 0,
      latencyMs,
      timestamp: Date.now(),
      outputPreview,
      metadata: {
        topOpportunity: topOpportunity?.name,
        targetMonthlyIncome: profile.targetMonthlyIncome,
      },
    });
    setRan(true);
  };

  const toggleSkill = (skill: string) => {
    setProfile((current) => {
      const exists = current.skillTags.includes(skill);
      return {
        ...current,
        skillTags: exists
          ? current.skillTags.filter((item) => item !== skill)
          : [...current.skillTags, skill],
      };
    });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/80">
        <h2 className="text-3xl font-semibold text-white">Wealth Compounder OS</h2>
        <p className="mt-3 max-w-3xl text-sm text-white/70">
          Mobile-first capital planning engine: convert your time, skills, risk profile, and budget into the highest-leverage income opportunities with an execution loop you can run from any phone.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <GlassCard title="Founder Inputs" accent="sky">
            <label className="block text-xs text-white/60">
              Hours per week
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
                value={profile.hoursPerWeek}
                onChange={(event) => setProfile((p) => ({ ...p, hoursPerWeek: Number(event.target.value) || 1 }))}
              />
            </label>
            <label className="mt-4 block text-xs text-white/60">
              Monthly capital ($)
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
                value={profile.monthlyCapital}
                onChange={(event) => setProfile((p) => ({ ...p, monthlyCapital: Number(event.target.value) || 0 }))}
              />
            </label>
            <label className="mt-4 block text-xs text-white/60">
              Target monthly income ($)
              <input
                type="number"
                min={100}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
                value={profile.targetMonthlyIncome}
                onChange={(event) =>
                  setProfile((p) => ({ ...p, targetMonthlyIncome: Number(event.target.value) || 100 }))
                }
              />
            </label>
            <label className="mt-4 block text-xs text-white/60">
              Existing audience size
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
                value={profile.existingAudience}
                onChange={(event) => setProfile((p) => ({ ...p, existingAudience: Number(event.target.value) || 0 }))}
              />
            </label>
            <label className="mt-4 block text-xs text-white/60">
              Automation readiness ({profile.automationReadiness})
              <input
                type="range"
                min={10}
                max={100}
                className="mt-2 w-full"
                value={profile.automationReadiness}
                onChange={(event) =>
                  setProfile((p) => ({ ...p, automationReadiness: Number(event.target.value) }))
                }
              />
            </label>
            <label className="mt-4 block text-xs text-white/60">
              Risk profile
              <select
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
                value={profile.riskLevel}
                onChange={(event) => setProfile((p) => ({ ...p, riskLevel: event.target.value as RiskLevel }))}
              >
                <option value="low">Low</option>
                <option value="balanced">Balanced</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </label>
            <div className="mt-4">
              <p className="text-xs text-white/60">Skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {skillsCatalog.map((skill) => {
                  const active = profile.skillTags.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        active
                          ? "border-sky-300/60 bg-sky-500/20 text-sky-100"
                          : "border-white/15 bg-white/5 text-white/70"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              className="mt-5 w-full rounded-full bg-sky-500/30 px-4 py-2 text-sm font-medium text-sky-100 hover:bg-sky-500/40"
              onClick={runPlanner}
            >
              Compute Wealth Plan
            </button>
          </GlassCard>
        </aside>

        <section className="space-y-4">
          {opportunities.map((opportunity, index) => (
            <GlassCard
              key={opportunity.id}
              title={`#${index + 1} ${opportunity.name}`}
              description={opportunity.summary}
              accent={index === 0 ? "emerald" : "sky"}
            >
              <div className="mt-3 grid gap-3 text-xs text-white/70 sm:grid-cols-2">
                <p>Fit: {opportunity.scoreBreakdown.fit}/100</p>
                <p>Capital efficiency: {opportunity.scoreBreakdown.capitalEfficiency}/100</p>
                <p>Risk alignment: {opportunity.scoreBreakdown.riskAlignment}/100</p>
                <p>Time alignment: {opportunity.scoreBreakdown.timeAlignment}/100</p>
              </div>
              <p className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs text-white/80">
                Compound Score: <span className="font-semibold text-emerald-200">{opportunity.score}/100</span>
              </p>
              <p className="mt-3 text-xs text-white/75">{opportunity.thirtyDayTarget}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-white/70">
                {opportunity.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </GlassCard>
          ))}

          {topOpportunity && (
            <GlassCard title="Daily Compounding Loop" accent="violet">
              <ol className="list-decimal space-y-2 pl-5 text-sm text-white/80">
                {loop.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-white/60">
                Phone-ready command message: “I am executing {topOpportunity.name} today. First deliverable ships in 90 minutes. Distribution sprint starts immediately after.”
              </p>
              {ran && <p className="mt-2 text-xs text-emerald-300">Planner run saved to telemetry log.</p>}
            </GlassCard>
          )}
        </section>
      </div>
    </div>
  );
}
