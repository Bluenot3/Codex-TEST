"use client";

import { useEffect, useState } from "react";

interface HealthResponse {
  ok: boolean;
  missingKeys: string[];
}

const HEALTH_ENDPOINT = "/api/health";

export function KeyGate({ initialHasKey }: { initialHasKey: boolean }) {
  const [health, setHealth] = useState<HealthResponse | null>(
    initialHasKey ? { ok: true, missingKeys: [] } : { ok: false, missingKeys: ["OPENAI_API_KEY"] }
  );
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    async function checkHealth() {
      try {
        setStatus("loading");
        const res = await fetch(HEALTH_ENDPOINT, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Health check failed with ${res.status}`);
        }
        const payload: HealthResponse = await res.json();
        if (!cancelled) {
          setHealth(payload);
          setStatus("idle");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    checkHealth();

    const interval = setInterval(checkHealth, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const missing = health?.missingKeys ?? [];
  const hasMissing = missing.length > 0;

  if (!hasMissing && status !== "error") {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-300/40 bg-amber-200/10 p-6 text-amber-100 shadow-xl backdrop-blur-md">
      <div className="absolute inset-px rounded-[calc(theme(borderRadius.3xl)-1px)] bg-amber-100/5" />
      <div className="relative space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold uppercase tracking-wide">Environment setup</h2>
          <span className="rounded-full bg-amber-300/20 px-3 py-1 text-xs font-semibold text-amber-50 shadow-inner">
            {status === "error" ? "Degraded" : "Action required"}
          </span>
        </div>
        <p className="text-sm text-amber-50/80 sm:text-base">
          Add the following keys in Vercel → Project Settings → Environment Variables. Deployments stay
          interactive even while keys are missing.
        </p>
        <ul className="space-y-1 text-sm font-medium text-amber-50/90">
          {missing.map((key) => (
            <li key={key} className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-300" aria-hidden />
              <span>{key}</span>
            </li>
          ))}
        </ul>
        {status === "error" && (
          <p className="text-xs text-amber-100/60">
            Health check could not confirm configuration. Double-check network settings and retry.
          </p>
        )}
      </div>
    </section>
  );
}
