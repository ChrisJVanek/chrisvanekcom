"use client";

import Link from "next/link";
import { DEXA_STATS, DEXA_REPORT_PDF, DEXA_SCAN_DATE, type DexaStat, type DexaStatus } from "@/data/dexa";

const STATUS_COLORS: Record<DexaStatus, { ring: string; text: string }> = {
  optimal: {
    ring: "stroke-emerald-500 dark:stroke-emerald-400",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  moderate: {
    ring: "stroke-amber-500 dark:stroke-amber-400",
    text: "text-amber-600 dark:text-amber-400",
  },
  above: {
    ring: "stroke-rose-500 dark:stroke-rose-400",
    text: "text-rose-600 dark:text-rose-400",
  },
};

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function StatCircle({ stat }: { stat: DexaStat }) {
  const colors = STATUS_COLORS[stat.status];
  const displayValue = typeof stat.value === "number" ? stat.value : stat.value;
  const isNumeric = typeof stat.value === "number";
  // For numeric stats: show arc as fraction of a max (body fat max 40%, BMI max 35)
  const maxVal = stat.label === "Body fat" ? 40 : stat.label === "BMI" ? 35 : 100;
  const fraction = isNumeric && typeof stat.value === "number" ? Math.min(stat.value / maxVal, 1) : 1;
  const dashOffset = CIRCUMFERENCE * (1 - fraction);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28 sm:w-32 sm:h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            className="stroke-black/10 dark:stroke-white/10"
          />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className={colors.ring}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display font-bold text-xl sm:text-2xl tabular-nums ${colors.text}`}>
            {displayValue}
            {stat.unit}
          </span>
        </div>
      </div>
      <span className="font-display text-sm font-medium text-ink mt-2">{stat.label}</span>
      <span className="text-xs text-mute mt-0.5">{stat.optimalRange}</span>
    </div>
  );
}

export function DexaSection() {
  return (
    <section className="mb-12 rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-gradient-to-b from-black/[0.02] to-transparent dark:from-white/[0.03] dark:to-transparent">
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
              Body composition
            </h2>
            <p className="text-sm text-mute mt-0.5">
              DEXA scan · {new Date(DEXA_SCAN_DATE + "T12:00:00").toLocaleDateString(undefined, { dateStyle: "long" })}
            </p>
          </div>
          <Link
            href={DEXA_REPORT_PDF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-ink text-paper dark:bg-paper dark:text-ink px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            View full report
            <span aria-hidden>↗</span>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6 sm:gap-8">
          {DEXA_STATS.map((stat) => (
            <StatCircle key={stat.label} stat={stat} />
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-black/10 dark:border-white/10">
          <p className="text-xs text-mute">
            Optimal: green · Moderate: amber · Above target: red. Open the full report for detailed regional breakdown and recommendations.
          </p>
        </div>
      </div>
    </section>
  );
}
