"use client";

import { ReactNode } from "react";
import { useSettingsStore, ProviderKey } from "../lib/state/settings";

interface KeyGuardProps {
  provider?: ProviderKey;
  children: ReactNode;
  onRequestSettings?: () => void;
}

export const KeyGuard = ({ provider = "openai", children, onRequestSettings }: KeyGuardProps) => {
  const hasKey = useSettingsStore((state) => Boolean(state.decryptedKeys[provider]));

  if (hasKey) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/20 bg-white/10 p-10 text-center text-white/80">
      <h2 className="text-2xl font-semibold text-white">API Key Required</h2>
      <p className="max-w-md text-sm text-white/70">
        Provide your {provider.toUpperCase()} API key in Settings to unlock this lab. Keys are encrypted locally with Web Crypto and never sent to the server.
      </p>
      <button
        type="button"
        onClick={onRequestSettings}
        className="rounded-full border border-sky-400/40 bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/30"
      >
        Open Settings
      </button>
    </div>
  );
};
