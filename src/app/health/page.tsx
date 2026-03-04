import Link from "next/link";
import {
  getCronometerDailySummaries,
  getCronometerServings,
  getCronometerUpdatedAt,
  type CronometerServing,
} from "@/lib/cronometer";
import { getHealthData } from "@/lib/health";
import { DailySummaryCard } from "@/components/DailySummaryCard";
import { DexaSection } from "@/components/DexaSection";
import { BloodTestSection } from "@/components/BloodTestSection";
import { ExpandableFoodLog } from "@/components/ExpandableFoodLog";
import { formatDateInSiteTz, formatDateTimeInSiteTz } from "@/lib/site";

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

function formatUpdatedAt(iso: string | null | undefined): string {
  if (!iso) return "";
  return formatDateTimeInSiteTz(iso);
}

/** Rows for calories (Cronometer) + activity (Apple Health only). No weight from Apple Health. */
function getCaloriesAndActivityRows(
  cronometerDays: { date: string; energyKcal: number }[],
  activityEntries: { date: string; minutes: number }[]
): Array<{ date: string; consumed: number | null; activityMinutes: number | null }> {
  const byDate = new Map<string, { consumed: number | null; activityMinutes: number | null }>();
  for (const a of activityEntries) {
    byDate.set(a.date, { consumed: null, activityMinutes: a.minutes });
  }
  for (const d of cronometerDays) {
    const existing = byDate.get(d.date) ?? { consumed: null, activityMinutes: null };
    byDate.set(d.date, { ...existing, consumed: d.energyKcal });
  }
  return Array.from(byDate.entries())
    .map(([date, rest]) => ({ date, ...rest }))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}

const CALORIE_GOAL = 1500;

export default async function HealthPage() {
  const healthData = getHealthData();
  const [cronometerDays, cronometerServings, cronometerUpdatedAt] = await Promise.all([
    getCronometerDailySummaries(),
    getCronometerServings(),
    getCronometerUpdatedAt(),
  ]);
  const hasCronometer = cronometerDays.length > 0 || cronometerServings.length > 0;
  const servingsByDayMap = servingsByDay(cronometerServings);
  const caloriesActivityRows = getCaloriesAndActivityRows(cronometerDays, healthData.activity);
  const hasActivitySection = caloriesActivityRows.length > 0;

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
          Nutrition and weight. Days and times are in GMT+10.
        </p>
      </header>

      <DexaSection />
      <BloodTestSection />

      <section className="mb-12 rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-black/[0.02] dark:bg-white/[0.02]">
        <div className="p-6 sm:p-8">
          <h2 className="font-display text-sm font-medium uppercase tracking-widest text-mute mb-6">
            Current protocols
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-display font-semibold text-ink mb-1">Hair loss — NOVAMANE</h3>
              <p className="text-sm text-mute leading-relaxed">
                Have begun a hair loss protocol called NOVAMANE, aiming to explore topical solutions for minoxidil as well.
              </p>
            </div>
            <div>
              <h3 className="font-display font-semibold text-ink mb-1">Cholesterol</h3>
              <p className="text-sm text-mute leading-relaxed mb-2">
                Currently taking:
              </p>
              <ul className="text-sm text-mute list-disc list-inside space-y-0.5">
                <li>Citrus Bergamot</li>
                <li>Red Yeast Rice 600mg</li>
                <li>Triple Strength Fish Oil</li>
                <li>Vitamin D</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

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
            {cronometerUpdatedAt && (
              <p className="text-xs text-mute mt-4">
                Last updated: {formatUpdatedAt(cronometerUpdatedAt)}
              </p>
            )}
          </section>
        </>
      )}

      {hasActivitySection && (
        <section className="mb-10">
          <h2 className="font-display text-sm font-medium uppercase tracking-widest text-mute mb-4">
            Calories & activity
          </h2>
          <p className="text-sm text-mute mb-4">
            Calories from Cronometer; activity (exercise minutes) from Apple Health export only.
          </p>
          <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10">
                  <th className="font-display font-medium text-ink py-3 px-4">Date</th>
                  <th className="font-display font-medium text-ink py-3 px-4">Calories</th>
                  <th className="font-display font-medium text-ink py-3 px-4">Activity</th>
                  <th className="font-display font-medium text-ink py-3 px-4">vs goal</th>
                </tr>
              </thead>
              <tbody>
                {caloriesActivityRows.map((row) => (
                  <tr
                    key={row.date}
                    className="border-b border-black/5 dark:border-white/5 last:border-0"
                  >
                    <td className="py-3 px-4 text-ink">{formatDateInSiteTz(row.date, "short")}</td>
                    <td className="py-3 px-4 text-ink">
                      {row.consumed != null ? Math.round(row.consumed) : "—"}
                    </td>
                    <td className="py-3 px-4 text-ink tabular-nums">
                      {row.activityMinutes != null
                        ? row.activityMinutes >= 60
                          ? `${Math.floor(row.activityMinutes / 60)}h ${row.activityMinutes % 60}m`
                          : `${row.activityMinutes} min`
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      {row.consumed != null ? (
                        row.consumed <= CALORIE_GOAL ? (
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
          {healthData.updatedAt && healthData.activity.length > 0 && (
            <p className="text-xs text-mute mt-2">
              Activity last updated: {formatUpdatedAt(healthData.updatedAt)}
            </p>
          )}
        </section>
      )}

      {!hasCronometer && !hasActivitySection && (
        <section className="rounded-xl border border-black/10 dark:border-white/10 p-6 text-mute">
          <p>No entries yet.</p>
        </section>
      )}
    </main>
  );
}
