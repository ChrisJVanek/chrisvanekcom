"use client";

import { useState } from "react";
import type { CronometerServing } from "@/lib/cronometer";
import { formatDateInSiteTz } from "@/lib/site";

interface ExpandableFoodLogProps {
  servings: CronometerServing[];
}

const VALID_DAY = /^\d{4}-\d{2}-\d{2}$/;

function groupByDay(servings: CronometerServing[]): [string, CronometerServing[]][] {
  const byDay = new Map<string, CronometerServing[]>();
  for (const s of servings) {
    if (!s.day || !VALID_DAY.test(s.day)) continue;
    const list = byDay.get(s.day) ?? [];
    list.push(s);
    byDay.set(s.day, list);
  }
  return Array.from(byDay.entries()).sort((a, b) => (b[0] > a[0] ? 1 : -1));
}

export function ExpandableFoodLog({ servings }: ExpandableFoodLogProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const days = groupByDay(servings);

  if (days.length === 0) return null;

  return (
    <ul className="space-y-1">
      {days.map(([day, items]) => {
        const isExpanded = expandedDay === day;
        return (
          <li
            key={day}
            className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden bg-black/[0.02] dark:bg-white/[0.02]"
          >
            <button
              type="button"
              onClick={() => setExpandedDay(isExpanded ? null : day)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-expanded={isExpanded}
            >
              <time className="font-display text-sm font-medium text-ink">
                {formatDateInSiteTz(day, "short")}
              </time>
              <span className="text-mute text-sm">{items.length} entries</span>
              <span className="text-mute text-sm" aria-hidden>
                {isExpanded ? "−" : "+"}
              </span>
            </button>
            {isExpanded && (
              <ul className="border-t border-black/10 dark:border-white/10 divide-y divide-black/5 dark:divide-white/5">
                {items.map((s, i) => (
                  <li
                    key={`${day}-${i}-${s.foodName}-${s.time}`}
                    className="px-4 py-2.5 flex flex-wrap items-baseline justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-ink">{s.foodName}</span>
                      {s.amount && (
                        <span className="text-mute text-xs ml-2">{s.amount}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.time && (
                        <span className="text-xs text-mute tabular-nums">{s.time}</span>
                      )}
                      <span className="font-display font-semibold text-ink tabular-nums">
                        {s.energyKcal > 0 ? `${Math.round(s.energyKcal)} kcal` : "—"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
