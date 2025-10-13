"use client";

import { SECTION_TWO_QUESTS } from "../lib/gamify/quests";
import { useProgressStore } from "../lib/state/progress";

export const QuestList = () => {
  const completed = useProgressStore((state) => new Set(state.questsCompleted));

  return (
    <ol className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
      {SECTION_TWO_QUESTS.map((quest) => {
        const isComplete = completed.has(quest.id);
        const prerequisitesMet = quest.prerequisites.every((id) => completed.has(id));
        return (
          <li
            key={quest.id}
            className={`rounded-2xl border px-4 py-3 transition ${
              isComplete
                ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-50"
                : prerequisitesMet
                ? "border-white/15 bg-white/10 text-white"
                : "border-white/5 bg-white/3 text-white/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest opacity-80">{quest.type === "teach" ? "Teach" : "Test"}</span>
              <span className="text-xs">{quest.xp} XP</span>
            </div>
            <h3 className="mt-1 text-base font-semibold">{quest.title}</h3>
            <p className="text-xs opacity-80">{quest.summary}</p>
          </li>
        );
      })}
    </ol>
  );
};
