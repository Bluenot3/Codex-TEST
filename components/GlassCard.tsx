import { ReactNode } from "react";
import { cn } from "../lib/utils/cn";

interface GlassCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  accent?: "sky" | "violet" | "emerald" | "amber" | "slate";
  className?: string;
}

const accentRing: Record<NonNullable<GlassCardProps["accent"]>, string> = {
  sky: "shadow-sky-400/30",
  violet: "shadow-violet-400/30",
  emerald: "shadow-emerald-400/30",
  amber: "shadow-amber-400/40",
  slate: "shadow-slate-400/20",
};

export const GlassCard = ({ title, description, children, accent = "slate", className }: GlassCardProps) => (
  <section
    className={cn(
      "relative overflow-hidden rounded-3xl border border-white/10 bg-white/6 p-6 shadow-[0_20px_80px_-40px] backdrop-blur-3xl transition",
      accentRing[accent],
      "hover:border-white/20 focus-within:border-white/30",
      className
    )}
  >
    <div className="pointer-events-none absolute inset-px rounded-[calc(theme(borderRadius.3xl)-1px)] bg-white/5" />
    <div className="relative space-y-4">
      {(title || description) && (
        <header className="space-y-2">
          {title && <h2 className="text-lg font-semibold text-white/90">{title}</h2>}
          {description && <p className="text-sm text-white/70">{description}</p>}
        </header>
      )}
      {children}
    </div>
  </section>
);
