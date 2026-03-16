"use client";

import Link from "next/link";
import { GlassCard } from "../../components/GlassCard";
import { useProgressStore } from "../../lib/state/progress";
import { formatCurrency } from "../../lib/utils/format";

const overviewCards = [
  {
    title: "Agent Forge",
    href: "/(vanguard)/lab/agent-forge",
    summary: "Design adaptive agents with structured tool routing and reasoning traces.",
  },
  {
    title: "Toolsmith",
    href: "/(vanguard)/lab/toolsmith",
    summary: "Validate JSON schemas and simulate tool-calling workflows.",
  },
  {
    title: "Workflow Canvas",
    href: "/(vanguard)/lab/workflow-canvas",
    summary: "Orchestrate branching chains with latency telemetry.",
  },
  {
    title: "Prompt-Ops",
    href: "/(vanguard)/lab/prompt-ops",
    summary: "Optimize prompts with A/B testing and cost dashboards.",
  },
  {
    title: "Vision Studio",
    href: "/(vanguard)/lab/vision-studio",
    summary: "Extract structured data from multi-modal inputs.",
  },
  {
    title: "Data Broker",
    href: "/(vanguard)/lab/data-broker",
    summary: "Run retrieval-augmented responses with citations and cost guards.",
  },
  {
    title: "Wealth Compounder OS",
    href: "/(vanguard)/lab/wealth-compounder",
    summary: "Map your available time, skills, and capital into a daily wealth-compounding execution plan.",
  },
];

export default function SectionOverview() {
  const { xp, badges, runs } = useProgressStore((state) => ({
    xp: state.xp,
    badges: state.badges,
    runs: state.runs,
  }));
  const cost = runs.reduce((sum, run) => sum + run.cost, 0);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/80">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Module 2 · Section 2</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Lead with telemetry, teach by doing.</h2>
        <p className="mt-4 max-w-3xl text-sm text-white/70">
          Vanguard labs are live sandboxes. Bring your provider keys, route tasks across profiles, and watch cost, latency, and accuracy metrics update in real time. Complete each challenge to mint your executive credential.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-white/50">XP</p>
            <p className="text-lg font-semibold text-white">{xp.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-white/50">Badges</p>
            <p className="text-lg font-semibold text-white">{badges.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-white/50">Spend</p>
            <p className="text-lg font-semibold text-white">{formatCurrency(cost)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {overviewCards.map((card) => (
          <GlassCard key={card.title} title={card.title} description={card.summary} accent="sky">
            <Link
              href={card.href}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/15"
            >
              Enter Lab
            </Link>
          </GlassCard>
        ))}
      </section>
    </div>
  );
}
