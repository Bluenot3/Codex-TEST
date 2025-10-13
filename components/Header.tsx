"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SettingsSheet } from "./SettingsSheet";
import { useSettingsStore } from "../lib/state/settings";
import { useProgressStore } from "../lib/state/progress";
import { formatCurrency } from "../lib/utils/format";
import { MODEL_ROUTES } from "../lib/api/modelRoutes";
import { exportBadgeWallAsPng } from "./BadgeWall";

export const Header = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const router = useRouter();
  const { decryptedKeys, hydrate, ready } = useSettingsStore((state) => ({
    decryptedKeys: state.decryptedKeys,
    hydrate: state.hydrate,
    ready: state.ready,
  }));
  const { xp, rank, runs, totalCost } = useProgressStore((state) => ({
    xp: state.xp,
    rank: state.rank,
    runs: state.runs,
    totalCost: state.runs.reduce((sum, run) => sum + run.cost, 0),
  }));

  useEffect(() => {
    if (!ready) hydrate();
  }, [hydrate, ready]);

  useEffect(() => {
    let buffer: string[] = [];
    const handleKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "meta" || key === "control" || key === "shift") return;
      if (key === "g") {
        buffer = ["g"];
        return;
      }
      if (buffer[0] === "g" && key === "s") {
        event.preventDefault();
        setSettingsOpen(true);
        buffer = [];
        return;
      }
      if (buffer[0] === "g" && key === "l") {
        event.preventDefault();
        router.push("/(vanguard)/lab/agent-forge");
        buffer = [];
        return;
      }
      if (key === "escape") {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);

  const handleShare = useCallback(async () => {
    try {
      await exportBadgeWallAsPng();
    } catch (error) {
      console.error("Share export failed", error);
      alert("Unable to export PNG. Try again after completing a run.");
    }
  }, []);

  const keyCount = Object.keys(decryptedKeys).filter((key) => decryptedKeys[key as keyof typeof decryptedKeys]).length;

  return (
    <header className="sticky top-0 z-40 mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-3xl border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 to-white/5">
            <span className="text-xl font-black text-white">Z</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">ZEN Vanguard</p>
            <h1 className="text-2xl font-semibold text-white">Module 2 · Section 2 Ops Deck</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white"
          >
            Settings
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="rounded-full border border-sky-400/40 bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/30"
          >
            Share Progress
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-white/50">
            <span>Rank</span>
            <span>{rank.label}</span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-purple-400"
              style={{ width: `${Math.min(100, Math.round((rank.progress || 0) * 100))}%` }}
            />
          </div>
          <p className="mt-3 text-sm">{xp.toLocaleString()} XP accumulated</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
          <p className="text-xs uppercase tracking-widest text-white/50">Keys Secured</p>
          <p className="mt-2 text-2xl font-semibold text-white">{keyCount} / 4</p>
          <p className="text-xs text-white/60">Encrypted locally via Web Crypto</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
          <p className="text-xs uppercase tracking-widest text-white/50">Telemetry Snapshot</p>
          <p className="mt-2 text-2xl font-semibold text-white">{runs.length} runs</p>
          <p className="text-xs text-white/60">{formatCurrency(totalCost)} total compute cost</p>
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-2 text-sm text-white/70">
        <Link className="rounded-full bg-white/10 px-3 py-1 transition hover:bg-white/20 hover:text-white" href="/">
          Overview
        </Link>
        <Link className="rounded-full bg-white/10 px-3 py-1 transition hover:bg-white/20 hover:text-white" href="/(vanguard)/settings">
          Settings
        </Link>
        {MODEL_ROUTES.map((profile) => (
          <span key={profile.id} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
            {profile.label}: {profile.defaultModel}
          </span>
        ))}
      </nav>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
};
