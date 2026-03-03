import Link from "next/link";
import {
  getCronometerDailySummaries,
  getCronometerServings,
  type CronometerServing,
} from "@/lib/cronometer";
import { getHealthData, getDailySummary } from "@/lib/health";
import { DailySummaryCard } from "@/components/DailySummaryCard";

function servingsByDay(servings: CronometerServing[]): Map<string, CronometerServing[]> {
  const byDay = new Map<string, CronometerServing[]>();
  for (const s of servings) {
    const list = byDay.get(s.day) ?? [];
    list.push(s);
    byDay.set(s.day, list);
  }
  return byDay;
}

function ServingsByDay({ servings }: { servings: CronometerServing[] }) {
  const byDay = new Map<string, CronometerServing[]>();
  for (const s of servings) {
    const list = byDay.get(s.day) ?? [];
    list.push(s);
    byDay.set(s.day, list);
  }
  const days = Array.from(byDay.entries()).sort((a, b) => (b[0] > a[0] ? 1 : -1));

  return (
    <div className="space-y-8">
      {days.map(([day, items]) => (
        <section key={day} className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden bg-black/[0.02] dark:bg-white/[0.02]">
          <header className="px-4 py-3 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
            <time className="font-display text-sm font-medium text-ink">
              {new Date(day + "T12:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </time>
          </header>
          <ul className="divide-y divide-black/5 dark:divide-white/5">
            {items.map((s, i) => (
              <li key={`${day}-${i}-${s.foodName}-${s.time}`} className="px-4 py-3 flex flex-wrap items-baseline justify-between gap-2 sm:gap-4">
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
        </section>
      ))}
    </div>
  );
}

export const metadata = {
  title: "Health",
  description: "Weight and calorie tracking.",
};

export default function HealthPage() {
  const healthData = getHealthData();
  const healthSummary = getDailySummary(healthData);
  const cronometerDays = getCronometerDailySummaries();
  const cronometerServings = getCronometerServings();
  const hasCronometer = cronometerDays.length > 0 || cronometerServings.length > 0;
  const servingsByDayMap = servingsByDay(cronometerServings);

  return (
    <main className="max-w-2xl mx-auto px-5 py-16 md:py-24">
      <Link
        href="/"
        className="text-sm text-mute hover:text-accent transition-colors mb-8 inline-block"
      >
        ← Back home
      </Link>

      <header className="mb-12">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink mb-2">
          Health
        </h1>
        <p className="text-mute">
          Nutrition and weight.
        </p>
      </header>

      {hasCronometer && (
        <>
          <section className="mb-12" id="daily-summary">
            <h2 className="font-display text-sm font-medium uppercase tracking-widest text-mute mb-4">
              Daily summary
            </h2>
            <p className="text-sm text-mute mb-4">Click a day&apos;s kcal to see the food log.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {cronometerDays.map((day) => (
                <DailySummaryCard
                  key={day.date}
                  day={day}
                  servings={servingsByDayMap.get(day.date) ?? []}
                />
              ))}
            </div>
          </section>

          {cronometerServings.length > 0 && (
            <section className="mb-12" id="food-log">
              <h2 className="font-display text-sm font-medium uppercase tracking-widest text-mute mb-4">
                Food log
              </h2>
              <ServingsByDay servings={cronometerServings} />
            </section>
          )}
        </>
      )}

      {healthSummary.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-sm font-medium uppercase tracking-widest text-mute mb-4">
            Weight & calories
          </h2>
          <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10">
                  <th className="font-display font-medium text-ink py-3 px-4">Date</th>
                  <th className="font-display font-medium text-ink py-3 px-4">Weight (kg)</th>
                  <th className="font-display font-medium text-ink py-3 px-4">Calories</th>
                  <th className="font-display font-medium text-ink py-3 px-4">vs goal</th>
                </tr>
              </thead>
              <tbody>
                {healthSummary.map((row) => (
                  <tr
                    key={row.date}
                    className="border-b border-black/5 dark:border-white/5 last:border-0"
                  >
                    <td className="py-3 px-4 text-ink">{row.date}</td>
                    <td className="py-3 px-4 text-ink">
                      {row.weight != null ? row.weight.toFixed(1) : "—"}
                    </td>
                    <td className="py-3 px-4 text-ink">
                      {row.consumed != null ? row.consumed : "—"}
                    </td>
                    <td className="py-3 px-4">
                      {row.goal != null && row.consumed != null ? (
                        row.consumed <= row.goal ? (
                          <span className="text-green-600 dark:text-green-400">under</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">over</span>
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {healthData.updatedAt && (
            <p className="text-xs text-mute mt-2">
              Last updated: {new Date(healthData.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
            </p>
          )}
        </section>
      )}

      {!hasCronometer && healthSummary.length === 0 && (
        <section className="rounded-xl border border-black/10 dark:border-white/10 p-6 text-mute">
          <p>No entries yet.</p>
        </section>
      )}
    </main>
  );
}
