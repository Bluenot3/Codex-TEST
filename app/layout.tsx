import type { Metadata } from "next";
import "../styles/theme.css";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "ZEN Vanguard · Section 2",
  description: "Executive lab to operationalize advanced AI systems with telemetry, routing, and security.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-80">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(56,189,248,0.12),_transparent_60%)]" />
        </div>
        {children}
      </body>
    </html>
  );
}
