import Link from "next/link";
import {
  getCronometerDailySummaries,
  getCronometerServings,
  getCronometerUpdatedAt,
  getCronometerActivity,
  type CronometerServing,
} from "@/lib/cronometer";
import { getHealthData } from "@/lib/health";
import { DexaSection } from "@/components/DexaSection";
import { BloodTestSection } from "@/components/BloodTestSection";
import { NutritionTable } from "@/components/NutritionTable";
import { formatDateInSiteTz, formatDateTimeInSiteTz } from "@/lib/site";

const VALID_DAY = /^\d{4}-\d{2}-\d{2}$/;

function servingsByDay(servings: CronometerServing[]): Record<string, CronometerServing[]> {
  const byDay: Record<string, CronometerServing[]> = {};
  for (const s of servings) {
    if (!s.day || !VALID_DAY.test(s.day)) continue;
    (byDay[s.day] ??= []).push(s);
  }
  return byDay;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Health",
  description: "Weight and calorie tracking.",
};

function formatUpdatedAt(iso: string | null | undefined): string {
  if (!iso) return "";
  return formatDateTimeInSiteTz(iso);
}

function getActivityRows(
  activityEntries: { date: string; minutes: number }[],
  cronometerActivity: Array<{ date: string; minutes: number; caloriesBurned?: number }>,
  stepsEntries: Array<{ date: string; steps: number }>,
  caloriesBurnedEntries: Array<{ date: string; kcal: number }>
): Array<{
  date: string;
  activityMinutes: number | null;
  steps: number | null;
  caloriesBurned: number | null;
}> {
  const byDate = new Map<
    string,
    { activityMinutes: number | null; steps: number | null; caloriesBurned: number | null }
  >();
  for (const a of activityEntries) {
    byDate.set(a.date, { activityMinutes: a.minutes, steps: null, caloriesBurned: null });
  }
  for (const c of cronometerActivity) {
    const existing = byDate.get(c.date) ?? { activityMinutes: null, steps: null, caloriesBurned: null };
    byDate.set(c.date, {
      ...existing,
      activityMinutes: (existing.activityMinutes ?? 0) + c.minutes,
      caloriesBurned: (existing.caloriesBurned ?? 0) + (c.caloriesBurned ?? 0),
    });
  }
  for (const s of stepsEntries) {
    const existing = byDate.get(s.date) ?? { activityMinutes: null, steps: null, caloriesBurned: null };
    byDate.set(s.date, { ...existing, steps: s.steps });
  }
  for (const b of caloriesBurnedEntries) {
    const existing = byDate.get(b.date) ?? { activityMinutes: null, steps: null, caloriesBurned: null };
    byDate.set(b.date, { ...existing, caloriesBurned: (existing.caloriesBurned ?? 0) + b.kcal });
  }
  return Array.from(byDate.entries())
    .map(([date, rest]) => ({ date, ...rest }))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}

export default async function HealthPage() {
  const healthData = getHealthData();
  const [
    cronometerDays,
    cronometerServings,
    cronometerUpdatedAt,
    cronometerActivity,
  ] = await Promise.all([
    getCronometerDailySummaries(),
    getCronometerServings(),
    getCronometerUpdatedAt(),
    getCronometerActivity(),
  ]);
  const validServings = cronometerServings.filter((s) => s.day && VALID_DAY.test(s.day));
  const hasCronometer = cronometerDays.length > 0 || validServings.length > 0;
  const servingsByDayMap = servingsByDay(validServings);
  const activityRows = getActivityRows(
    healthData.activity,
    cronometerActivity,
    healthData.steps ?? [],
    healthData.caloriesBurned ?? []
  );
  const hasActivitySection = activityRows.length > 0;

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
              <p className="text-sm text-mute leading-relaxed mb-2">
                Micro-infusion protocol (copper peptides, serum via stamp). Started 1 March 2026. Brief summary from{" "}
                <a href="https://novamane.com/pages/instructions" target="_blank" rel="noopener noreferrer" className="text-ink underline hover:no-underline">NovaMane instructions</a>.
              </p>
              <ul className="text-sm text-mute list-disc list-inside space-y-1">
                <li><strong className="text-ink">Shampoo</strong> — Wash with sulfate-free shampoo (e.g. Regen™), pat scalp dry, wait 10–15 min so scalp is fully dry before treatment.</li>
                <li><strong className="text-ink">Dry needling</strong> — Stamp/roll in multiple directions (vertical, horizontal, diagonal), 4–6 passes per section, firm pressure. Creates micro-channels for serum.</li>
                <li><strong className="text-ink">Serum stamping</strong> — ~0.5 ml serum per session. Prime device on a tissue, then stamp scalp in a grid with 25–50% overlap, 2–3 rounds as tolerated. Don’t rinse for 8–12 hours.</li>
                <li><strong className="text-ink">Schedule</strong> — Week 1: once (test tolerance). Week 2: twice with a rest day. Week 3+: every other day. Evening application for overnight absorption. Sanitize needle head after each use (70% isopropyl 10 min); replace cartridge every 3–5 treatments (max 15).</li>
              </ul>
            </div>
            <div>
              <h3 className="font-display font-semibold text-ink mb-2">Daily cholesterol protocol</h3>
              <p className="text-sm text-mute leading-relaxed mb-3">
                Multi-mechanism protocol. Expected LDL reduction ~40–55% if consistent (8–12 weeks). Starting LDL ≈ 5.3 mmol/L → target ~2.4–3.2 mmol/L.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-mute border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10">
                      <th className="text-left py-2 pr-4 font-medium text-ink">Time</th>
                      <th className="text-left py-2 font-medium text-ink">Supplement</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr]:border-b [&_tr]:border-black/5 [&_tr]:dark:border-white/5">
                    <tr><td className="py-2 pr-4">Morning, 20–30 min before breakfast</td><td>Psyllium husk 5 g powder or ~7 caps + 400–500 ml water (binds bile acids)</td></tr>
                    <tr><td className="py-2 pr-4">With breakfast (with some fat)</td><td>Plant sterols ~1 g · Citrus bergamot 500 mg · Berberine 500 mg</td></tr>
                    <tr><td className="py-2 pr-4">20–30 min before dinner</td><td>Psyllium husk 5 g or ~7 caps + large glass water</td></tr>
                    <tr><td className="py-2 pr-4">With dinner</td><td>Plant sterols ~1 g · Citrus bergamot 500 mg · Berberine 500 mg · CoQ10 100–200 mg (optional, recommended with RYR)</td></tr>
                    <tr><td className="py-2 pr-4">Night (before bed)</td><td>Red yeast rice 1200 mg total daily (or 600 mg if higher-strength caps). Cholesterol synthesis peaks overnight.</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-mute mt-3">
                Mechanisms: RYR → reduce production; Berberine → LDL receptor clearance; Bergamot → lipid metabolism; Sterols → block absorption; Psyllium → bile excretion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {hasCronometer && (
        <section className="mb-12" id="daily-summary">
          <h2 className="font-display text-sm font-medium uppercase tracking-widest text-mute mb-2">
            Daily nutrition
          </h2>
          <p className="text-sm text-mute mb-4">
            From Cronometer. Click a row to expand the food log.
          </p>
          <NutritionTable days={cronometerDays} servingsByDay={servingsByDayMap} />
          {cronometerUpdatedAt && (
            <p className="text-xs text-mute mt-3">
              Last synced: {formatUpdatedAt(cronometerUpdatedAt)}
            </p>
          )}
        </section>
      )}

      {hasActivitySection && (
        <section className="mb-10">
          <h2 className="font-display text-sm font-medium uppercase tracking-widest text-mute mb-2">
            Activity
          </h2>
          <p className="text-sm text-mute mb-4">
            Exercise minutes, steps, and calories burned from Apple Health auto export and Cronometer.
          </p>
          <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03]">
                  <th className="font-display font-medium text-ink py-2.5 px-4">Date</th>
                  <th className="font-display font-medium text-ink py-2.5 px-4 text-right">Exercise</th>
                  <th className="font-display font-medium text-ink py-2.5 px-4 text-right">Steps</th>
                  <th className="font-display font-medium text-ink py-2.5 px-4 text-right">Burned</th>
                </tr>
              </thead>
              <tbody>
                {activityRows.map((row) => (
                  <tr
                    key={row.date}
                    className="border-b border-black/5 dark:border-white/5 last:border-0"
                  >
                    <td className="py-2.5 px-4 text-ink">{formatDateInSiteTz(row.date, "short")}</td>
                    <td className="py-2.5 px-4 text-ink tabular-nums text-right">
                      {row.activityMinutes != null
                        ? row.activityMinutes >= 60
                          ? `${Math.floor(row.activityMinutes / 60)}h ${Math.round(row.activityMinutes % 60)}m`
                          : `${Math.round(row.activityMinutes)} min`
                        : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-ink tabular-nums text-right">
                      {row.steps != null ? row.steps.toLocaleString() : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-ink tabular-nums text-right">
                      {row.caloriesBurned != null ? `${Math.round(row.caloriesBurned)} kcal` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {healthData.updatedAt &&
            (healthData.activity.length > 0 ||
              (healthData.steps?.length ?? 0) > 0 ||
              (healthData.caloriesBurned?.length ?? 0) > 0) && (
              <p className="text-xs text-mute mt-2">
                Last updated: {formatUpdatedAt(healthData.updatedAt)}
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
