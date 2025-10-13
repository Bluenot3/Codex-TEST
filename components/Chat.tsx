"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "../lib/models/openai";
import { DEFAULT_ROUTE_ID, MODEL_ROUTES, getRouteById } from "../lib/router";
import { ExportBar } from "./ExportBar";
import { Presets } from "./Presets";
import { TelemetryOverlay, type TelemetryMetrics } from "./TelemetryOverlay";

const DEFAULT_SYSTEM_PROMPT =
  "You are the ZEN AI Command Deck copilot. Respond with safe, visible reasoning and highlight follow-up actions succinctly.";

const TOKEN_ESTIMATE_DIVISOR = 4;

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / TOKEN_ESTIMATE_DIVISOR));
}

export function Chat() {
  const [routeId, setRouteId] = useState(DEFAULT_ROUTE_ID);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryMetrics | null>(null);
  const [showTelemetry, setShowTelemetry] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const route = getRouteById(routeId);

  const messagesForExport = useMemo<ChatMessage[]>(
    () => [{ role: "system", content: systemPrompt }, ...thread],
    [systemPrompt, thread]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    setTelemetry(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const conversationContext: ChatMessage[] = [{ role: "system", content: systemPrompt }, ...thread];
    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const requestMessages = [...conversationContext, userMessage];

    setThread((prev) => [...prev, userMessage, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    let streamed = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: requestMessages, route: routeId }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        let detail = "";
        try {
          const parsed = await response.json();
          detail = parsed?.error ?? JSON.stringify(parsed);
        } catch (err) {
          detail = response.statusText;
        }
        throw new Error(detail || "Chat request failed");
      }

      const providerHeader = response.headers.get("x-model-provider") ?? route.provider;
      const modelLabelHeader = response.headers.get("x-model-label") ?? route.label;
      const latencyHeader = response.headers.get("x-latency");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        streamed += chunk;
        setThread((prev) => {
          const next = [...prev];
          const lastIndex = next.length - 1;
          next[lastIndex] = {
            ...next[lastIndex],
            content: (next[lastIndex]?.content ?? "") + chunk,
          };
          return next;
        });
      }

      const tokensIn = estimateTokens(requestMessages.map((message) => message.content).join("\n"));
      const tokensOut = estimateTokens(streamed);
      const costUSD =
        (tokensIn / 1000) * route.pricing.input + (tokensOut / 1000) * route.pricing.output;

      setTelemetry({
        provider: providerHeader,
        model: route.model,
        modelLabel: modelLabelHeader,
        tokensIn,
        tokensOut,
        costUSD,
        latencyMs: latencyHeader ? Number.parseInt(latencyHeader, 10) : undefined,
      });
    } catch (err) {
      const errorObject = err as Error;
      if (errorObject.name === "AbortError") {
        setError("Streaming stopped by user.");
      } else {
        const message = errorObject.message || "Unknown error";
        setError(message);
        setThread((prev) => prev.slice(0, -2));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  const hasConversation = thread.length > 0;

  return (
    <section className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-lg">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium uppercase tracking-wide text-white/60">
          Model
          <select
            value={routeId}
            onChange={(event) => setRouteId(event.target.value)}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            {MODEL_ROUTES.map((option) => (
              <option key={option.id} value={option.id} className="bg-slate-900 text-white">
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <Presets systemPrompt={systemPrompt} onApply={setSystemPrompt} />
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTelemetry((prev) => !prev)}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-white/70 transition hover:border-sky-300/60 hover:text-white"
          >
            Telemetry {showTelemetry ? "On" : "Off"}
          </button>
          <ExportBar messages={messagesForExport} routeId={routeId} />
        </div>
      </div>
      {showTelemetry ? <TelemetryOverlay metrics={telemetry} /> : null}
      <div className="space-y-3">
        {!hasConversation ? (
          <p className="text-sm text-slate-200/70">
            Start a conversation to validate streaming responses across providers.
          </p>
        ) : (
          <div className="space-y-3">
            {thread.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm backdrop-blur-sm ${
                  message.role === "user"
                    ? "border-sky-400/30 bg-sky-400/10 text-sky-50"
                    : "border-white/20 bg-white/5 text-white/80"
                }`}
              >
                <span className="block text-xs uppercase tracking-wide text-white/60">
                  {message.role === "user" ? "You" : "AI"}
                </span>
                <span>{message.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={isStreaming ? "Streaming in progress..." : "Send a message"}
            className="flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm text-white/90 placeholder:text-white/40 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            disabled={isStreaming}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-sky-500/40"
              disabled={isStreaming || input.trim().length === 0}
            >
              {isStreaming ? "Streaming" : "Send"}
            </button>
            {isStreaming ? (
              <button
                type="button"
                onClick={handleStop}
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:border-rose-300/60 hover:text-white"
              >
                Stop
              </button>
            ) : null}
          </div>
        </div>
        {error ? <p className="text-xs text-rose-200/80">{error}</p> : null}
      </form>
    </section>
  );
}
