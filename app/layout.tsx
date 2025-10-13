import type { Metadata } from "next";
import "../styles/globals.css";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "ZEN AI Command Deck";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Operate AI systems with clarity across providers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_60%)]" />
          <div className="relative z-10 w-full max-w-5xl space-y-6">
            <header className="flex flex-col gap-2 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-300/80">ZEN</p>
              <h1 className="text-4xl font-semibold sm:text-5xl">{APP_NAME}</h1>
              <p className="text-base text-slate-300/90 sm:text-lg">
                A glassmorphic command deck for safe, visible AI orchestration.
              </p>
            </header>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
