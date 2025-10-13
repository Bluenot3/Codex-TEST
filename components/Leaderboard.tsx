"use client";

import { useMemo, useState } from "react";
import { useProgressStore } from "../lib/state/progress";
import { BADGE_DEFINITIONS } from "../lib/gamify/badges";

const GLOBAL_LEADERBOARD = [
  { name: "A. Rivera", org: "ZEN Research", xp: 5200 },
  { name: "Morgan Lee", org: "Helios Capital", xp: 4800 },
  { name: "Priya Shah", org: "Flux Systems", xp: 4550 },
  { name: "You", org: "Local Device", xp: 0 },
];

export const Leaderboard = () => {
  const [showGlobal, setShowGlobal] = useState(true);
  const { xp, badges } = useProgressStore((state) => ({ xp: state.xp, badges: state.badges }));

  const leaderboard = useMemo(() => {
    const entries = GLOBAL_LEADERBOARD.map((entry) =>
      entry.name === "You" ? { ...entry, xp } : entry
    );
    return entries.sort((a, b) => b.xp - a.xp);
  }, [xp]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/80">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Leaderboard</h3>
        <button
          type="button"
          className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/20"
          onClick={() => setShowGlobal((prev) => !prev)}
        >
          {showGlobal ? "Hide global" : "Show global"}
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {(showGlobal ? leaderboard : leaderboard.filter((entry) => entry.name === "You")).map((entry, index) => (
          <li
            key={entry.name}
            className={`flex items-center justify-between rounded-2xl border px-4 py-2 ${
              entry.name === "You" ? "border-sky-400/40 bg-sky-500/20 text-white" : "border-white/10 bg-white/5"
            }`}
          >
            <span>
              <span className="text-xs uppercase tracking-widest text-white/50">#{index + 1}</span>
              <span className="ml-2 font-medium text-white">{entry.name}</span>
              <span className="ml-2 text-xs text-white/50">{entry.org}</span>
            </span>
            <span className="font-semibold text-white">{entry.xp.toLocaleString()} XP</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-white/60">Badges unlocked: {badges.length} / {BADGE_DEFINITIONS.length}</p>
    </div>
  );
};
