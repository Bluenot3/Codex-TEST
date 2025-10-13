import Link from "next/link";

export const Footer = () => (
  <footer className="mx-auto mt-16 w-full max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">ZEN Ecosystem</p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="https://us.zenai.world"
          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:border-white/40 hover:text-white"
        >
          Try full ZEN Arena
        </Link>
        <Link
          href="https://us.zenai.world"
          className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/20"
        >
          Mint credential (after Section 2)
        </Link>
      </div>
    </div>
    <p className="mt-4 text-xs text-white/50">© {new Date().getFullYear()} ZEN AI Co. All rights reserved.</p>
  </footer>
);
