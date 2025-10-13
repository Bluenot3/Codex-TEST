"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MODEL_ROUTES } from "../lib/api/modelRoutes";
import { useSettingsStore, ProviderKey } from "../lib/state/settings";
import { cn } from "../lib/utils/cn";

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

type FormState = Record<ProviderKey, string>;

const PROVIDER_LABELS: Record<ProviderKey, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google Vertex",
  mistral: "Mistral",
};

export const SettingsSheet = ({ open, onClose }: SettingsSheetProps) => {
  const {
    decryptedKeys,
    hydrate,
    ready,
    defaultProfile,
    telemetryOptIn,
    advancedProviders,
    setDefaultProfile,
    setTelemetryOptIn,
    toggleAdvancedProviders,
    storeKey,
    forgetKey,
    exportSettings,
    importSettings,
    clearAll,
  } = useSettingsStore((state) => state);

  const [form, setForm] = useState<FormState>({
    openai: "",
    anthropic: "",
    google: "",
    mistral: "",
  });
  const [importPayload, setImportPayload] = useState("{}");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !ready) {
      hydrate();
    }
  }, [open, ready, hydrate]);

  useEffect(() => {
    if (!open) return;
    setForm((prev) => ({
      ...prev,
      openai: decryptedKeys.openai ?? prev.openai,
      anthropic: decryptedKeys.anthropic ?? prev.anthropic,
      google: decryptedKeys.google ?? prev.google,
      mistral: decryptedKeys.mistral ?? prev.mistral,
    }));
  }, [decryptedKeys, open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setStatus(null);
      setError(null);
    }
  }, [open]);

  const providerList = useMemo<ProviderKey[]>(() => {
    return advancedProviders
      ? ["openai", "anthropic", "google", "mistral"]
      : (["openai"] as ProviderKey[]);
  }, [advancedProviders]);

  const handleSave = async (provider: ProviderKey, override?: string) => {
    const value = (override ?? form[provider])?.trim();
    try {
      if (!value) {
        await forgetKey(provider);
        setForm((prev) => ({ ...prev, [provider]: "" }));
        setStatus(`${PROVIDER_LABELS[provider]} key removed.`);
      } else {
        validateKey(provider, value);
        await storeKey(provider, value);
        setStatus(`${PROVIDER_LABELS[provider]} key secured.`);
      }
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setStatus(null);
    }
  };

  const handleExport = async () => {
    try {
      const payload = await exportSettings();
      await navigator.clipboard.writeText(payload);
      setStatus("Settings exported to clipboard.");
    } catch (err) {
      setError("Unable to export settings.");
      console.error(err);
    }
  };

  const handleImport = async () => {
    try {
      await importSettings(importPayload);
      setStatus("Settings imported.");
      setError(null);
    } catch (err) {
      setError("Import failed. Check JSON payload.");
      console.error(err);
    }
  };

  const handleClear = async () => {
    await clearAll();
    setForm({ openai: "", anthropic: "", google: "", mistral: "" });
    setStatus("All settings cleared.");
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur"
      role="dialog"
      aria-modal
      aria-labelledby="settings-title"
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur-xl"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 id="settings-title" className="text-xl font-semibold text-white">
              Mission Settings
            </h2>
            <p className="text-sm text-white/60">
              Keys never leave your device. AES-GCM encrypted in localStorage with PBKDF2 rotation.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="grid max-h-[80vh] grid-cols-1 gap-6 overflow-y-auto px-6 py-6 md:grid-cols-2">
          <section className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">Provider Keys</h3>
                <p className="text-xs text-white/50">
                  Stored as ciphertext under <code className="rounded bg-white/10 px-1 py-0.5">zen.secure.kv</code>. Never transmitted.
                </p>
              </div>
              <div className="space-y-4">
                {providerList.map((provider) => (
                  <label key={provider} className="block space-y-2">
                    <span className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-white/60">
                      {PROVIDER_LABELS[provider]}
                      {decryptedKeys[provider] && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">Encrypted</span>}
                    </span>
                    <input
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-sky-400 focus:outline-none"
                      placeholder="sk-..."
                      type="password"
                      value={form[provider] ?? ""}
                      onChange={(event) => setForm((prev) => ({ ...prev, [provider]: event.target.value }))}
                      onBlur={() => decryptedKeys[provider] && setForm((prev) => ({ ...prev, [provider]: decryptedKeys[provider] ?? "" }))}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-medium text-sky-100 transition hover:bg-sky-500/30"
                        onClick={() => handleSave(provider)}
                      >
                        Save
                      </button>
                      {decryptedKeys[provider] && (
                        <button
                          type="button"
                          className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 transition hover:bg-white/20"
                          onClick={() => handleSave(provider, "")}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </label>
                ))}
                <button
                  type="button"
                  className="text-xs text-white/60 underline decoration-dotted underline-offset-4 hover:text-white"
                  onClick={toggleAdvancedProviders}
                >
                  {advancedProviders ? "Hide advanced providers" : "Show advanced provider fields"}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">Default Model Profile</h3>
              <div className="grid gap-2">
                {MODEL_ROUTES.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => setDefaultProfile(profile.id)}
                    className={cn(
                      "flex w-full items-start justify-between rounded-2xl border px-4 py-3 text-left transition",
                      defaultProfile === profile.id
                        ? "border-sky-400/50 bg-sky-500/10 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
                    )}
                  >
                    <span>
                      <span className="text-sm font-medium">{profile.label}</span>
                      <p className="text-xs text-white/60">{profile.description}</p>
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-white/40">{profile.defaultModel}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">Privacy & Telemetry</h3>
              <p className="text-xs text-white/60">
                Anonymous usage metrics help calibrate the ZEN Vanguard experience. Toggle anytime. No prompts or keys are transmitted.
              </p>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-sm text-white/80">Enable anonymous telemetry</span>
                <input
                  type="checkbox"
                  checked={telemetryOptIn}
                  onChange={(event) => setTelemetryOptIn(event.target.checked)}
                  className="h-4 w-4 rounded border border-white/40 bg-slate-900 text-sky-400"
                />
              </label>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-white/80">Security Posture</h3>
              <ul className="mt-3 space-y-2 text-xs text-white/60">
                <li>• AES-GCM ciphertext stored at rest. PBKDF2 master key rotates on demand.</li>
                <li>• Keys never leave the browser. API calls use direct provider endpoints.</li>
                <li>• Optional proxy rejects without explicit SERVER_PROXY flag.</li>
              </ul>
            </div>

            <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-white/80">Export / Import</h3>
              <p className="text-xs text-white/60">
                Export settings (including encrypted secrets) to a secure note. Import payloads to sync devices.
              </p>
              <textarea
                className="min-h-[160px] flex-1 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                value={importPayload}
                onChange={(event) => setImportPayload(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full bg-sky-500/20 px-4 py-1.5 text-xs font-medium text-sky-100 transition hover:bg-sky-500/30"
                  onClick={handleExport}
                >
                  Export to clipboard
                </button>
                <button
                  type="button"
                  className="rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/30"
                  onClick={handleImport}
                >
                  Import JSON
                </button>
                <button
                  type="button"
                  className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white/80 transition hover:bg-white/20"
                  onClick={handleClear}
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-white/80">Keyboard Shortcuts</h3>
              <p className="mt-2 text-xs text-white/60">
                <kbd className="rounded bg-white/10 px-2 py-1 text-[10px] uppercase tracking-widest">g</kbd>
                <span className="mx-1 text-white/40">+</span>
                <kbd className="rounded bg-white/10 px-2 py-1 text-[10px] uppercase tracking-widest">s</kbd> Open Settings
              </p>
              <p className="text-xs text-white/60">
                <kbd className="rounded bg-white/10 px-2 py-1 text-[10px] uppercase tracking-widest">g</kbd>
                <span className="mx-1 text-white/40">+</span>
                <kbd className="rounded bg-white/10 px-2 py-1 text-[10px] uppercase tracking-widest">l</kbd> Jump to Labs
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-100">
              <p className="font-semibold uppercase tracking-wide text-emerald-200">Privacy Promise</p>
              <p className="mt-2">
                No server storage. Secrets encrypted in your browser. Toggle telemetry at any time. Learn more at our privacy desk.
              </p>
            </div>
          </section>
        </div>
        {(status || error) && (
          <div className="border-t border-white/10 bg-slate-950/70 px-6 py-3 text-sm">
            {status && <p className="text-emerald-300">{status}</p>}
            {error && <p className="text-rose-300">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

const validateKey = (provider: ProviderKey, key: string) => {
  if (provider === "openai" && !key.startsWith("sk-")) {
    throw new Error("OpenAI keys must start with sk-");
  }
  if (key.length < 20) {
    throw new Error("Key appears too short");
  }
};
