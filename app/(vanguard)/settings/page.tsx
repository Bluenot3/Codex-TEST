"use client";

import { useState } from "react";
import { SettingsSheet } from "../../../components/SettingsSheet";
import { KeyGuard } from "../../../components/KeyGuard";

export default function SettingsPage() {
  const [open, setOpen] = useState(true);
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/80">
        <h2 className="text-3xl font-semibold text-white">Settings & Security</h2>
        <p className="mt-3 max-w-2xl text-sm text-white/70">
          Paste provider keys, choose default model profiles, export encrypted backups, and manage telemetry preferences. Keys are encrypted using Web Crypto with AES-GCM and PBKDF2 key rotation.
        </p>
        <button
          type="button"
          className="mt-6 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white hover:border-white/40"
          onClick={() => setOpen(true)}
        >
          Manage secure settings
        </button>
      </section>
      <KeyGuard provider="openai" onRequestSettings={() => setOpen(true)}>
        <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-sm text-emerald-100">
          <p className="font-medium">OpenAI key detected.</p>
          <p className="text-emerald-200/80">Access labs to begin streaming telemetry.</p>
        </div>
      </KeyGuard>
      <SettingsSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
