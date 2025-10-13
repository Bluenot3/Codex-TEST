"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "../../../../components/GlassCard";
import { KeyGuard } from "../../../../components/KeyGuard";
import { MetricPills } from "../../../../components/MetricPills";
import { TokenCostBar } from "../../../../components/TokenCostBar";
import { useProgressStore } from "../../../../lib/state/progress";

interface WorkflowNode {
  id: string;
  type: "Prompt" | "Tool" | "Branch" | "Review" | "Notify";
  label: string;
  latencyMs: number;
  tokens: number;
}

const nodeDefaults: Record<WorkflowNode["type"], { latency: number; tokens: number }> = {
  Prompt: { latency: 520, tokens: 320 },
  Tool: { latency: 350, tokens: 120 },
  Branch: { latency: 180, tokens: 40 },
  Review: { latency: 420, tokens: 210 },
  Notify: { latency: 120, tokens: 30 },
};

export default function WorkflowCanvasLab() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    createNode("Prompt"),
    createNode("Tool"),
    createNode("Review"),
  ]);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [challengeMode, setChallengeMode] = useState(false);
  const addRun = useProgressStore((state) => state.addRun);
  const recordChallenge = useProgressStore((state) => state.recordChallenge);
  const incrementMetric = useProgressStore((state) => state.incrementMetric);
  const refreshBadges = useProgressStore((state) => state.refreshBadges);
  const [message, setMessage] = useState<string | null>(null);

  const totals = useMemo(() => {
    const latencyMs = nodes.reduce((sum, node) => sum + node.latencyMs, 0);
    const promptTokens = nodes.filter((node) => node.type === "Prompt").reduce((sum, node) => sum + node.tokens, 0);
    const completionTokens = nodes.filter((node) => node.type !== "Prompt").reduce((sum, node) => sum + node.tokens, 0);
    const cost = (promptTokens / 1000) * 0.0005 + (completionTokens / 1000) * 0.0015;
    return { latencyMs, promptTokens, completionTokens, cost };
  }, [nodes]);

  useEffect(() => {
    refreshBadges();
  }, [nodes, refreshBadges]);

  const playback = () => {
    if (!nodes.length) return;
    setMessage("Playing workflow");
    let index = 0;
    setActiveNode(nodes[0].id);
    const interval = setInterval(() => {
      index += 1;
      if (index >= nodes.length) {
        clearInterval(interval);
        setActiveNode(null);
        setMessage("Playback complete");
        logRun();
        return;
      }
      setActiveNode(nodes[index].id);
    }, 600);
  };

  const logRun = async () => {
    const id = crypto.randomUUID();
    addRun({
      id,
      lab: "workflow-canvas",
      model: "workflow-simulator",
      promptTokens: totals.promptTokens,
      completionTokens: totals.completionTokens,
      cost: totals.cost,
      latencyMs: totals.latencyMs,
      timestamp: Date.now(),
      outputPreview: JSON.stringify(exportWorkflow(nodes), null, 2),
      metadata: { nodes: nodes.length, latency: totals.latencyMs },
    });
    incrementMetric("workflowsPublished");
    if (challengeMode) {
      const res = await fetch("/api/score", {
        method: "POST",
        body: JSON.stringify({
          challengeId: "workflow-speedrun",
          submission: {
            output: JSON.stringify(exportWorkflow(nodes)),
            cost: totals.cost,
            tokens: totals.promptTokens + totals.completionTokens,
            latencyMs: totals.latencyMs,
            metadata: { nodes: nodes.length, latency: totals.latencyMs },
          },
        }),
      });
      if (res.ok) {
        const json = await res.json();
        recordChallenge("workflow-speedrun", json.result.score, json.result.xp);
      }
    }
  };

  const exportJson = () => {
    const data = JSON.stringify(exportWorkflow(nodes), null, 2);
    navigator.clipboard.writeText(data);
    setMessage("Workflow JSON copied");
  };

  const exportBpmn = () => {
    const bpmn = generateBpmn(nodes);
    navigator.clipboard.writeText(bpmn);
    setMessage("BPMN exported to clipboard");
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/80">
        <h2 className="text-3xl font-semibold text-white">Workflow Canvas</h2>
        <p className="mt-3 max-w-3xl text-sm text-white/70">
          60-second brief: Compose multi-step orchestration with explicit latency awareness. Drag nodes conceptually, watch playback, and export JSON/BPMN artifacts for governance reviews.
        </p>
        <label className="mt-6 inline-flex items-center gap-2 text-xs text-white/60">
          <input type="checkbox" checked={challengeMode} onChange={(event) => setChallengeMode(event.target.checked)} />
          Challenge mode: <span className="ml-1">Keep total latency under 2 seconds</span>
        </label>
      </section>
      <KeyGuard provider="openai">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)_280px]">
          <aside className="space-y-4">
            <GlassCard title="Nodes" accent="sky">
              <div className="flex flex-wrap gap-2">
                {(["Prompt", "Tool", "Branch", "Review", "Notify"] as WorkflowNode["type"][]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/20"
                    onClick={() => setNodes((prev) => [...prev, createNode(type)])}
                  >
                    + {type}
                  </button>
                ))}
              </div>
              <ul className="mt-4 space-y-3 text-xs text-white/80">
                {nodes.map((node, index) => (
                  <li key={node.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{index + 1}. {node.type}</span>
                      <button
                        type="button"
                        className="text-xs text-white/60 hover:text-rose-300"
                        onClick={() => setNodes((prev) => prev.filter((item) => item.id !== node.id))}
                      >
                        Remove
                      </button>
                    </div>
                    <label className="mt-2 block text-[11px] uppercase tracking-widest text-white/50">
                      Latency (ms)
                      <input
                        type="number"
                        min={0}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-white"
                        value={node.latencyMs}
                        onChange={(event) =>
                          setNodes((prev) =>
                            prev.map((item) =>
                              item.id === node.id ? { ...item, latencyMs: Number(event.target.value) } : item
                            )
                          )
                        }
                      />
                    </label>
                  </li>
                ))}
              </ul>
            </GlassCard>
            <GlassCard title="Exports" accent="violet">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/20"
                  onClick={exportJson}
                >
                  Copy JSON
                </button>
                <button
                  type="button"
                  className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/20"
                  onClick={exportBpmn}
                >
                  Copy BPMN
                </button>
              </div>
              {message && <p className="mt-3 text-xs text-white/60">{message}</p>}
            </GlassCard>
          </aside>
          <section className="space-y-4">
            <GlassCard title="Playback" accent="emerald">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>{nodes.length} nodes</span>
                <span>{(totals.latencyMs / 1000).toFixed(2)}s total</span>
              </div>
              <ol className="mt-4 space-y-3">
                {nodes.map((node) => (
                  <li
                    key={node.id}
                    className={`rounded-2xl border px-4 py-3 text-sm transition ${
                      node.id === activeNode
                        ? "border-emerald-400/40 bg-emerald-500/20 text-white"
                        : "border-white/10 bg-white/5 text-white/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{node.type}</span>
                      <span className="text-xs text-white/60">{node.latencyMs} ms</span>
                    </div>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={playback}
                className="mt-4 w-full rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/30"
              >
                Play Workflow
              </button>
            </GlassCard>
          </section>
          <aside className="space-y-4">
            <GlassCard title="Metrics" accent="amber">
              <MetricPills
                tokensIn={totals.promptTokens}
                tokensOut={totals.completionTokens}
                cost={totals.cost}
                latencyMs={totals.latencyMs}
                model="workflow"
              />
              <div className="mt-4">
                <TokenCostBar
                  breakdown={{
                    promptTokens: totals.promptTokens,
                    completionTokens: totals.completionTokens,
                    totalTokens: totals.promptTokens + totals.completionTokens,
                    cost: totals.cost,
                  }}
                />
              </div>
            </GlassCard>
          </aside>
        </div>
      </KeyGuard>
    </div>
  );
}

const createNode = (type: WorkflowNode["type"]): WorkflowNode => ({
  id: crypto.randomUUID(),
  type,
  label: `${type} node`,
  latencyMs: nodeDefaults[type].latency,
  tokens: nodeDefaults[type].tokens,
});

const exportWorkflow = (nodes: WorkflowNode[]) => ({
  version: 1,
  nodes: nodes.map((node, index) => ({
    id: node.id,
    type: node.type,
    order: index + 1,
    latencyMs: node.latencyMs,
  })),
});

const generateBpmn = (nodes: WorkflowNode[]) => {
  const steps = nodes
    .map(
      (node, index) =>
        `<bpmn:task id="Task_${index + 1}" name="${node.type} (${node.latencyMs}ms)"></bpmn:task>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\">\n  <bpmn:process id=\"Workflow\">\n    ${steps}\n  </bpmn:process>\n</bpmn:definitions>`;
};
