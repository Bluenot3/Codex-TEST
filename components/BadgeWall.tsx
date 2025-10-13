"use client";

import { useMemo } from "react";
import { BADGE_DEFINITIONS } from "../lib/gamify/badges";
import { useProgressStore } from "../lib/state/progress";
import { formatCurrency } from "../lib/utils/format";

export const BADGE_WALL_ID = "badge-wall-svg";

export const BadgeWall = () => {
  const { badges, xp, runs } = useProgressStore((state) => ({
    badges: state.badges,
    xp: state.xp,
    runs: state.runs,
  }));
  const badgeMap = useMemo(() => new Set(badges), [badges]);
  const totalCost = runs.reduce((sum, run) => sum + run.cost, 0);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <svg id={BADGE_WALL_ID} viewBox="0 0 640 360" className="w-full">
        <defs>
          <linearGradient id="zenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="640" height="360" rx="32" fill="rgba(15,23,42,0.85)" />
        <text x="40" y="60" fill="#f8fafc" fontSize="28" fontFamily="'Inter', sans-serif" fontWeight="600">
          ZEN Vanguard — Section 2 Progress
        </text>
        <text x="40" y="100" fill="#94a3b8" fontSize="16" fontFamily="'Inter', sans-serif">
          XP: {xp.toLocaleString()} · Runs Logged: {runs.length} · Spend: {formatCurrency(totalCost)}
        </text>
        {BADGE_DEFINITIONS.map((badge, index) => {
          const columns = 4;
          const row = Math.floor(index / columns);
          const col = index % columns;
          const x = 40 + col * 150;
          const y = 140 + row * 90;
          const unlocked = badgeMap.has(badge.id);
          return (
            <g key={badge.id} transform={`translate(${x}, ${y})`}>
              <rect
                width="120"
                height="70"
                rx="18"
                fill={unlocked ? "url(#zenGradient)" : "rgba(148,163,184,0.2)"}
                stroke={unlocked ? "rgba(255,255,255,0.8)" : "rgba(148,163,184,0.4)"}
                strokeWidth="1.5"
              />
              <text
                x="60"
                y="32"
                textAnchor="middle"
                fill={unlocked ? "#0f172a" : "#cbd5f5"}
                fontSize="14"
                fontWeight="600"
                fontFamily="'Inter', sans-serif"
              >
                {badge.name}
              </text>
              <text
                x="60"
                y="50"
                textAnchor="middle"
                fill={unlocked ? "#0f172a" : "#94a3b8"}
                fontSize="10"
                fontFamily="'Inter', sans-serif"
              >
                {badge.description}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const exportBadgeWallAsPng = async () => {
  const svg = document.getElementById(BADGE_WALL_ID) as SVGSVGElement | null;
  if (!svg) throw new Error("Badge wall not rendered");
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();
  const canvas = document.createElement("canvas");
  canvas.width = svg.viewBox.baseVal.width;
  canvas.height = svg.viewBox.baseVal.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unsupported");
  await new Promise<void>((resolve, reject) => {
    image.onload = () => {
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);
      resolve();
    };
    image.onerror = (err) => reject(err);
    image.src = url;
  });
  const png = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = png;
  link.download = "zen-vanguard-progress.png";
  link.click();
};
