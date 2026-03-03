"use client";

import {
  CHOLESTEROL_TOTAL,
  BLOOD_TEST_STATS,
  BLOOD_TEST_REPORT_PDF,
  type BloodTestStat,
  type BloodTestStatus,
} from "@/data/blood-test";

const STATUS_COLORS: Record<BloodTestStatus, { ring: string; text: string }> = {
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

function CholesterolGauge({ stat }: { stat: BloodTestStat }) {
  const colors = STATUS_COLORS[stat.status];
  const maxVal = 300;
  const fraction = Math.min(stat.value / maxVal, 1);
  const dashOffset = CIRCUMFERENCE * (1 - fraction);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36 sm:w-40 sm:h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            className="stroke-black/10 dark:stroke-white/10"
          />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className={colors.ring}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display font-bold text-2xl sm:text-3xl tabular-nums ${colors.text}`}>
            {stat.value}
          </span>
          <span className="text-sm text-mute">{stat.unit}</span>
        </div>
      </div>
      <span className="font-display text-base font-semibold text-ink mt-3">{stat.label}</span>
      <span className="text-sm text-mute mt-0.5">Optimal: {stat.optimalRange}</span>
    </div>
  );
}

function SmallStatCircle({ stat }: { stat: BloodTestStat }) {
  const colors = STATUS_COLORS[stat.status];
  const maxVal = stat.label === "HDL" ? 100 : 300;
  const fraction = Math.min(stat.value / maxVal, 1);
  const dashOffset = CIRCUMFERENCE * (1 - fraction);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="6"
            className="stroke-black/10 dark:stroke-white/10"
          />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className={colors.ring}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display font-bold text-sm sm:text-base tabular-nums ${colors.text}`}>
            {stat.value}
          </span>
        </div>
      </div>
      <span className="font-display text-xs font-medium text-ink mt-1">{stat.label}</span>
      <span className="text-[10px] text-mute">{stat.optimalRange}</span>
    </div>
  );
}

export function BloodTestSection() {
  const openReport = () => {
    window.open(BLOOD_TEST_REPORT_PDF, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="mb-12 rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-gradient-to-b from-black/[0.02] to-transparent dark:from-white/[0.03] dark:to-transparent">
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            Blood test
          </h2>
          <button
            type="button"
            onClick={openReport}
            className="inline-flex items-center gap-2 rounded-lg bg-ink text-paper dark:bg-paper dark:text-ink px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            View report
          </button>
        </div>

        <p className="text-sm text-mute mb-6">
          Get total cholesterol down to a healthy level. Green = optimal, amber = moderate, red = above target.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-start gap-8 sm:gap-10">
          <button
            type="button"
            onClick={openReport}
            className="flex flex-col items-center rounded-xl p-4 -m-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
            aria-label="View blood test report"
          >
            <CholesterolGauge stat={CHOLESTEROL_TOTAL} />
          </button>
          <div className="flex-1 grid grid-cols-3 gap-4 sm:gap-6">
            {BLOOD_TEST_STATS.map((stat) => (
              <SmallStatCircle key={stat.label} stat={stat} />
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-black/10 dark:border-white/10 flex flex-wrap gap-4 text-xs text-mute">
          <span><strong className="text-ink">Total cholesterol:</strong> &lt; 200 mg/dL optimal</span>
          <span><strong className="text-ink">LDL:</strong> &lt; 100 optimal</span>
          <span><strong className="text-ink">HDL:</strong> ≥ 60 optimal (higher is better)</span>
          <span><strong className="text-ink">Triglycerides:</strong> &lt; 150 optimal</span>
        </div>
      </div>
    </section>
  );
}
