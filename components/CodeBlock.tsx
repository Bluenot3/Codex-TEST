"use client";

import { ReactNode } from "react";

interface CodeBlockProps {
  language?: string;
  children: ReactNode;
}

export const CodeBlock = ({ language = "json", children }: CodeBlockProps) => (
  <div className="relative">
    <div className="absolute right-3 top-3">
      <button
        type="button"
        className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/20"
        onClick={() => navigator.clipboard.writeText(String(children))}
      >
        Copy
      </button>
    </div>
    <pre className="max-h-[360px] overflow-auto rounded-3xl border border-white/10 bg-slate-950/80 p-5 text-xs leading-relaxed text-white/80">
      <code className={`language-${language}`}>{children}</code>
    </pre>
  </div>
);
