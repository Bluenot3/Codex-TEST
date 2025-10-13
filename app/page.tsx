import { Chat } from "../components/Chat";
import { KeyGate } from "../components/KeyGate";

const statusItems = [
  {
    title: "System",
    description: "Streaming chat and router online with latency telemetry and export controls.",
    status: "Operational",
  },
  {
    title: "Providers",
    description: "OpenAI live; Anthropic & Gemini stubs signal configuration requirements.",
    status: "Live",
  },
  {
    title: "Visibility",
    description: "Telemetry overlay, presets, and transcript export keep every call observable.",
    status: "Complete",
  },
];

export default function HomePage() {
  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

  return (
    <main className="space-y-6">
      <KeyGate initialHasKey={hasOpenAIKey} />
      <div className="grid gap-6 sm:grid-cols-2">
        {statusItems.map((item) => (
          <section
            key={item.title}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-sky-500/10 backdrop-blur-md transition hover:border-sky-400/40 focus-within:border-sky-400/60"
          >
            <div className="absolute inset-px rounded-[calc(theme(borderRadius.3xl)-1px)] bg-white/5 opacity-0 transition group-hover:opacity-100" />
            <div className="relative space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white/90">{item.title}</h2>
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-200">
                  {item.status}
                </span>
              </div>
              <p className="text-sm text-slate-200/80 sm:text-base">{item.description}</p>
              <button className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white/80 shadow-inner transition hover:border-sky-300/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
                View roadmap
              </button>
            </div>
          </section>
        ))}
      </div>
      <Chat />
    </main>
  );
}
