import Link from "next/link";
import {
  getCronometerDailySummaries,
  getCronometerServings,
  type CronometerServing,
} from "@/lib/cronometer";
import { getHealthData, getDailySummary } from "@/lib/health";
import { DailySummaryCard } from "@/components/DailySummaryCard";
import { DexaSection } from "@/components/DexaSection";
import { BloodTestSection } from "@/components/BloodTestSection";
import { ExpandableFoodLog } from "@/components/ExpandableFoodLog";

function servingsByDay(servings: CronometerServing[]): Map<string, CronometerServing[]> {
  const byDay = new Map<string, CronometerServing[]>();
  for (const s of servings) {
    const list = byDay.get(s.day) ?? [];
    list.push(s);
    byDay.set(s.day, list);
  }
  return byDay;
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

      <DexaSection />
      <BloodTestSection />

      {hasCronometer && (
        <>
          <section className="mb-12" id="daily-summary">
            <p className="text-sm text-mute mb-6">
              Daily summary is updated daily from exported logs. Click a day&apos;s kcal to open the food log in an overlay.
            </p>
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
              <div>
                <h2 className="font-display text-sm font-medium uppercase tracking-widest text-mute mb-4">
                  Daily summary
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {cronometerDays.map((day) => (
                    <DailySummaryCard
                      key={day.date}
                      day={day}
                      servings={servingsByDayMap.get(day.date) ?? []}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h2 className="font-display text-sm font-medium uppercase tracking-widest text-mute mb-4">
                  Food log
                </h2>
                <ExpandableFoodLog servings={cronometerServings} />
              </div>
            </div>
          </section>
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
