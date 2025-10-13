"use client";

import { useEffect, useMemo, useState } from "react";

export interface PresetOption {
  id: string;
  label: string;
  prompt: string;
  builtIn?: boolean;
}

const STORAGE_KEY = "zen-command-deck-presets";

const DEFAULT_PRESETS: PresetOption[] = [
  {
    id: "zen-default",
    label: "ZEN default",
    prompt:
      "You are the ZEN AI Command Deck copilot. Respond with safe, visible reasoning and highlight follow-up actions succinctly.",
    builtIn: true,
  },
  {
    id: "brief-qna",
    label: "Brief Q&A",
    prompt: "Provide short, factual answers with a single actionable next step.",
    builtIn: true,
  },
  {
    id: "safety-check",
    label: "Safety check",
    prompt: "Assess the provided prompt for policy or trust & safety concerns before responding.",
    builtIn: true,
  },
];

function loadStoredPresets(): PresetOption[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PresetOption[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function persistPresets(presets: PresetOption[]) {
  if (typeof window === "undefined") return;
  const userPresets = presets.filter((preset) => !preset.builtIn);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userPresets));
}

export function Presets({
  systemPrompt,
  onApply,
}: {
  systemPrompt: string;
  onApply: (prompt: string) => void;
}) {
  const [presets, setPresets] = useState<PresetOption[]>(() => [...DEFAULT_PRESETS]);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_PRESETS[0].id);

  useEffect(() => {
    const stored = loadStoredPresets();
    if (stored.length) {
      setPresets([...DEFAULT_PRESETS, ...stored]);
    }
  }, []);

  useEffect(() => {
    persistPresets(presets);
  }, [presets]);

  useEffect(() => {
    const match = presets.find((preset) => preset.prompt === systemPrompt);
    if (match) {
      setSelectedId(match.id);
    } else {
      setSelectedId("custom");
    }
  }, [systemPrompt, presets]);

  const options = useMemo(() => [{ id: "custom", label: "Custom", prompt: systemPrompt }, ...presets], [presets, systemPrompt]);

  function handleSelect(id: string) {
    setSelectedId(id);
    const preset = presets.find((item) => item.id === id);
    if (preset) {
      onApply(preset.prompt);
    }
  }

  function handleSave() {
    const label = window.prompt("Preset name", "My preset");
    if (!label) return;
    const newPreset: PresetOption = {
      id: `user-${Date.now()}`,
      label,
      prompt: systemPrompt,
    };
    setPresets((prev) => [...prev, newPreset]);
    setSelectedId(newPreset.id);
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 shadow-inner">
      <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-white/60">
        Preset
        <select
          value={selectedId}
          onChange={(event) => handleSelect(event.target.value)}
          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          {options.map((option) => (
            <option key={option.id} value={option.id} className="bg-slate-900 text-white">
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={handleSave}
        className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/70 transition hover:border-sky-300/60 hover:text-white"
      >
        Save
      </button>
    </div>
  );
}
