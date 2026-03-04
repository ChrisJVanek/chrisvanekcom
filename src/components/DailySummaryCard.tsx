"use client";

import { useState, useCallback } from "react";
import type { CronometerDailySummary, CronometerServing } from "@/lib/cronometer";

interface DailySummaryCardProps {
  day: CronometerDailySummary;
  servings: CronometerServing[];
}

const CALORIE_GOAL = 1500;
const OVER_THRESHOLD = 100; // over goal by more than this = Certified Fatty

function getDayStatus(kcal: number): string | null {
  if (kcal <= CALORIE_GOAL) return "Let's go girl";
  if (kcal > CALORIE_GOAL + OVER_THRESHOLD) return "Certified Fatty";
  return null;
}

export function DailySummaryCard({ day, servings }: DailySummaryCardProps) {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const status = getDayStatus(day.energyKcal);
  const closeOverlay = useCallback(() => setOverlayOpen(false), []);

  return (
    <>
      <article className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden bg-black/[0.02] dark:bg-white/[0.02] hover:border-accent/30 transition-colors">
        <div className="p-4 sm:p-5">
          <time className="font-display text-sm font-medium text-mute uppercase tracking-wider block mb-3">
            {new Date(day.date + "T12:00:00").toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          <button
            type="button"
            onClick={() => setOverlayOpen(true)}
            className="flex items-baseline gap-2 mb-4 text-left rounded-md -m-1 p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/40"
            aria-label={`View food log for ${day.date}`}
          >
            <span className="text-2xl sm:text-3xl font-display font-semibold text-ink tabular-nums">
              {Math.round(day.energyKcal)}
            </span>
            <span className="text-mute text-sm">kcal</span>
          </button>
          {status && (
            <p className="text-sm font-medium text-ink mb-3">
              Status: {status}
            </p>
          )}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-black/5 dark:bg-white/5 py-2 px-1">
              <div className="text-xs text-mute uppercase tracking-wider">Protein</div>
              <div className="font-display font-semibold text-ink tabular-nums">{day.proteinG.toFixed(0)}g</div>
            </div>
            <div className="rounded-lg bg-black/5 dark:bg-white/5 py-2 px-1">
              <div className="text-xs text-mute uppercase tracking-wider">Carbs</div>
              <div className="font-display font-semibold text-ink tabular-nums">{day.carbsG.toFixed(0)}g</div>
            </div>
            <div className="rounded-lg bg-black/5 dark:bg-white/5 py-2 px-1">
              <div className="text-xs text-mute uppercase tracking-wider">Fat</div>
              <div className="font-display font-semibold text-ink tabular-nums">{day.fatG.toFixed(0)}g</div>
            </div>
          </div>
          {(day.fiberG > 0 || day.sodiumMg > 0) && (
            <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex gap-4 text-xs text-mute">
              {day.fiberG > 0 && <span>Fiber {day.fiberG.toFixed(0)}g</span>}
              {day.sodiumMg > 0 && <span>Sodium {day.sodiumMg.toFixed(0)}mg</span>}
            </div>
          )}
        </div>
      </article>

      {overlayOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-label="Food log"
          onClick={closeOverlay}
        >
          <div
            className="rounded-xl border border-black/10 dark:border-white/10 bg-paper dark:bg-paper shadow-xl max-h-[80vh] w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="px-4 py-3 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-between">
              <time className="font-display text-sm font-medium text-ink">
                {new Date(day.date + "T12:00:00").toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </time>
              <button
                type="button"
                onClick={closeOverlay}
                className="text-mute hover:text-ink p-1 rounded focus:outline-none focus:ring-2 focus:ring-accent/40"
                aria-label="Close"
              >
                ✕
              </button>
            </header>
            <div className="overflow-y-auto max-h-[60vh]">
              {servings.length === 0 ? (
                <p className="px-4 py-6 text-mute text-sm">No food entries for this day.</p>
              ) : (
                <ul className="divide-y divide-black/5 dark:divide-white/5">
                  {servings.map((s, i) => (
                    <li
                      key={`${day.date}-${i}-${s.foodName}-${s.time}`}
                      className="px-4 py-3 flex flex-wrap items-baseline justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-ink">{s.foodName}</span>
                        {s.amount && (
                          <span className="text-mute text-sm ml-2">{s.amount}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {s.time && (
                          <span className="text-xs text-mute tabular-nums">{s.time}</span>
                        )}
                        <span className="font-display font-semibold text-ink tabular-nums min-w-[3rem] text-right">
                          {s.energyKcal > 0 ? `${Math.round(s.energyKcal)} kcal` : "—"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
