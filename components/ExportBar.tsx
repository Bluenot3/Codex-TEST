"use client";

import { useState } from "react";
import type { ChatMessage } from "../lib/models/openai";

function buildCurl(routeId: string, messages: ChatMessage[]) {
  const payload = JSON.stringify({ route: routeId, messages }, null, 2);
  const escaped = payload.replace(/'/g, "'\\''");
  return [
    "curl -X POST https://your-deployment.vercel.app/api/chat \\",
    "  -H 'Content-Type: application/json' \\",
    `  -d '${escaped}'`,
  ].join("\n");
}

export function ExportBar({
  messages,
  routeId,
}: {
  messages: ChatMessage[];
  routeId: string;
}) {
  const [copied, setCopied] = useState(false);

  const hasConversation = messages.length > 1;

  function handleDownload() {
    if (!hasConversation) return;
    const blob = new Blob([JSON.stringify({ route: routeId, messages }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "zen-ai-command-deck-transcript.json";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    if (!hasConversation || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(buildCurl(routeId, messages));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 shadow-inner">
      <button
        type="button"
        onClick={handleDownload}
        disabled={!hasConversation}
        className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/70 transition hover:border-emerald-300/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Export JSON
      </button>
      <button
        type="button"
        onClick={handleCopy}
        disabled={!hasConversation}
        className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/70 transition hover:border-emerald-300/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copied ? "Copied" : "Copy cURL"}
      </button>
    </div>
  );
}
