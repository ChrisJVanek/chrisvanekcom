"use client";

import { useState } from "react";
import type {
  CronometerDailySummary,
  CronometerServing,
} from "@/lib/cronometer";
import { formatDateInSiteTz } from "@/lib/site";

const CALORIE_GOAL = 1500;
const OVER_THRESHOLD = 100;

interface NutritionTableProps {
  days: CronometerDailySummary[];
  servingsByDay: Record<string, CronometerServing[]>;
}

function statusLabel(kcal: number) {
  if (kcal <= 0) return null;
  if (kcal <= CALORIE_GOAL)
    return <span className="text-green-600 dark:text-green-400">Under</span>;
  if (kcal > CALORIE_GOAL + OVER_THRESHOLD)
    return <span className="text-red-500 dark:text-red-400">Over+</span>;
  return <span className="text-amber-600 dark:text-amber-400">Over</span>;
}

export function NutritionTable({ days, servingsByDay }: NutritionTableProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  if (days.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03]">
            <th className="font-display font-medium text-ink py-2.5 pl-4 pr-2 w-8" />
            <th className="font-display font-medium text-ink py-2.5 px-2">
              Date
            </th>
            <th className="font-display font-medium text-ink py-2.5 px-2 text-right">
              kcal
            </th>
            <th className="font-display font-medium text-ink py-2.5 px-2 text-right hidden sm:table-cell">
              P
            </th>
            <th className="font-display font-medium text-ink py-2.5 px-2 text-right hidden sm:table-cell">
              C
            </th>
            <th className="font-display font-medium text-ink py-2.5 px-2 text-right hidden sm:table-cell">
              F
            </th>
            <th className="font-display font-medium text-ink py-2.5 px-2 pr-4 text-right">
              Goal
            </th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const isOpen = expandedDay === day.date;
            const items = servingsByDay[day.date] ?? [];
            const hasItems = items.length > 0;
            const isEmpty = day.energyKcal <= 0;

            return (
              <Row
                key={day.date}
                day={day}
                items={items}
                hasItems={hasItems}
                isEmpty={isEmpty}
                isOpen={isOpen}
                onToggle={() =>
                  setExpandedDay(isOpen ? null : day.date)
                }
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Row({
  day,
  items,
  hasItems,
  isEmpty,
  isOpen,
  onToggle,
}: {
  day: CronometerDailySummary;
  items: CronometerServing[];
  hasItems: boolean;
  isEmpty: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={`border-b border-black/5 dark:border-white/5 last:border-0 transition-colors ${
          hasItems
            ? "cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
            : ""
        } ${isOpen ? "bg-black/[0.03] dark:bg-white/[0.03]" : ""} ${
          isEmpty ? "opacity-50" : ""
        }`}
        onClick={hasItems ? onToggle : undefined}
      >
        <td className="py-2.5 pl-4 pr-1 text-mute w-8">
          {hasItems && (
            <span
              className={`inline-block transition-transform text-xs ${
                isOpen ? "rotate-90" : ""
              }`}
            >
              ▶
            </span>
          )}
        </td>
        <td className="py-2.5 px-2 text-ink whitespace-nowrap">
          {formatDateInSiteTz(day.date, "short")}
        </td>
        <td className="py-2.5 px-2 text-ink tabular-nums text-right font-semibold">
          {isEmpty ? "—" : Math.round(day.energyKcal)}
        </td>
        <td className="py-2.5 px-2 text-mute tabular-nums text-right hidden sm:table-cell">
          {isEmpty ? "—" : `${Math.round(day.proteinG)}g`}
        </td>
        <td className="py-2.5 px-2 text-mute tabular-nums text-right hidden sm:table-cell">
          {isEmpty ? "—" : `${Math.round(day.carbsG)}g`}
        </td>
        <td className="py-2.5 px-2 text-mute tabular-nums text-right hidden sm:table-cell">
          {isEmpty ? "—" : `${Math.round(day.fatG)}g`}
        </td>
        <td className="py-2.5 px-2 pr-4 text-right">
          {statusLabel(day.energyKcal)}
        </td>
      </tr>
      {isOpen && items.length > 0 && (
        <tr>
          <td
            colSpan={7}
            className="p-0 border-b border-black/10 dark:border-white/10"
          >
            <div className="bg-black/[0.02] dark:bg-white/[0.02]">
              <table className="w-full text-sm">
                <tbody>
                  {items.map((s, i) => (
                    <tr
                      key={`${day.date}-${i}-${s.foodName}`}
                      className="border-b border-black/5 dark:border-white/5 last:border-0"
                    >
                      <td className="py-2 pl-10 pr-2 text-ink max-w-0">
                        <div className="truncate">{s.foodName}</div>
                        {s.amount && (
                          <div className="text-xs text-mute truncate">
                            {s.amount}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 text-xs text-mute tabular-nums whitespace-nowrap text-right">
                        {s.time || ""}
                      </td>
                      <td className="py-2 pl-2 pr-4 text-ink tabular-nums whitespace-nowrap text-right font-medium">
                        {s.energyKcal > 0
                          ? `${Math.round(s.energyKcal)}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
