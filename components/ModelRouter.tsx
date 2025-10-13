import { ChangeEvent } from "react";
import { resolveModel, ModelCapability } from "../lib/api/modelRoutes";
import { cn } from "../lib/utils/cn";

interface ModelRouterProps {
  profile: ModelCapability;
  availableModels: string[];
  value?: string;
  onChange?: (model: string) => void;
}

export const ModelRouter = ({ profile, availableModels, value, onChange }: ModelRouterProps) => {
  const { profile: profileMeta, model, downgraded } = resolveModel(profile, availableModels);
  const selected = value ?? model;
  const supported = availableModels.includes(selected);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange?.(event.target.value);
  };

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/50">{profileMeta.label}</p>
          <p className="text-sm text-white/70">{profileMeta.description}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">{profileMeta.defaultModel}</span>
      </div>
      <label className="block">
        <span className="text-xs uppercase tracking-widest text-white/50">Active model</span>
        <select
          className="mt-2 w-full rounded-2xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
          value={selected}
          onChange={handleChange}
        >
          {[profileMeta.defaultModel, ...profileMeta.fallbacks].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          {!profileMeta.fallbacks.includes(selected) && !selected.startsWith("openai") && (
            <option value={selected}>{selected}</option>
          )}
        </select>
      </label>
      <div
        className={cn(
          "rounded-2xl border px-4 py-3 text-xs",
          supported ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100" : "border-amber-400/40 bg-amber-500/10 text-amber-200"
        )}
      >
        {supported ? (
          <p>
            {downgraded
              ? `Downgraded to ${model} based on current access.`
              : `${selected} ready for routing.`}
          </p>
        ) : (
          <p>{selected} is unavailable. Switching to {model}.</p>
        )}
      </div>
    </div>
  );
};
