import Link from "next/link";
import {
  getCronometerDailySummaries,
  getCronometerServings,
  type CronometerDailySummary,
  type CronometerServing,
} from "@/lib/cronometer";
import { getHealthData, getDailySummary } from "@/lib/health";

function SyncOptions() {
  const ingestUrl = "https://chrisvanek.com/api/health/ingest";
  return (
    <section className="mt-8 rounded-xl border border-black/10 dark:border-white/10 p-4 text-sm text-mute bg-black/[0.02] dark:bg-white/[0.02]">
      <h3 className="font-display font-medium text-ink mb-2">Health Auto Export (REST API)</h3>
      <p className="mb-3">Use <strong>Format: JSON</strong> and add one header for auth.</p>
      <dl className="space-y-2">
        <div>
          <dt className="font-medium text-ink">URL</dt>
          <dd className="mt-0.5 break-all font-mono text-accent">{ingestUrl}</dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Header (for API key)</dt>
          <dd className="mt-0.5">
            Key: <code className="text-ink bg-black/5 dark:bg-white/10 px-1 rounded">Authorization</code>
            <br />
            Value: <code className="text-ink bg-black/5 dark:bg-white/10 px-1 rounded">Bearer YOUR_SECRET</code>
          </dd>
          <dd className="mt-1 text-xs">
            Set <code className="bg-black/5 dark:bg-white/10 px-1 rounded">HEALTH_INGEST_SECRET</code> in your deployment (e.g. Railway) to the same value you use after &quot;Bearer &quot;. Then paste that value here.
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs">
        Data type: <strong>Health Metrics</strong>. Enable <strong>Summarize data</strong> and pick e.g. <strong>Days</strong>. Weight and dietary energy are mapped automatically.
      </p>
      <p className="mt-4 text-xs">
        Export file option: Health app → Export All Health Data, then run{" "}
        <code className="text-ink bg-black/5 dark:bg-white/10 px-1 rounded">npm run health:ingest-apple path/to/export.xml</code>.
      </p>
    </section>
  );
}

function DailySummaryCard({ day }: { day: CronometerDailySummary }) {
  return (
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
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl sm:text-3xl font-display font-semibold text-ink tabular-nums">
            {Math.round(day.energyKcal)}
          </span>
          <span className="text-mute text-sm">kcal</span>
        </div>
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
  );
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
  description: "Weight and calorie tracking from Cronometer, Apple Health, and more.",
};

export default function HealthPage() {
  const healthData = getHealthData();
  const healthSummary = getDailySummary(healthData);
  const cronometerDays = getCronometerDailySummaries();
  const cronometerServings = getCronometerServings();
  const hasCronometer = cronometerDays.length > 0 || cronometerServings.length > 0;

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
          Nutrition and weight from Cronometer (daily summary + food log), plus Apple Health and manual data.
        </p>
      </header>

      {hasCronometer && (
        <>
          <section className="mb-12" id="cronometer-summary">
            <h2 className="font-display text-sm font-medium uppercase tracking-widest text-mute mb-4">
              Cronometer — Daily summary
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {cronometerDays.map((day) => (
                <DailySummaryCard key={day.date} day={day} />
              ))}
            </div>
          </section>

          {cronometerServings.length > 0 && (
            <section className="mb-12" id="cronometer-servings">
              <h2 className="font-display text-sm font-medium uppercase tracking-widest text-mute mb-4">
                Food log
              </h2>
              <ServingsByDay servings={cronometerServings} />
            </section>
          )}

          <p className="text-xs text-mute mb-6">
            Replace <code className="bg-black/5 dark:bg-white/10 px-1 rounded">src/data/cronometer/dailysummary.csv</code> and{" "}
            <code className="bg-black/5 dark:bg-white/10 px-1 rounded">servings.csv</code> with new exports from Cronometer to update.
          </p>
        </>
      )}

      {healthSummary.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-sm font-medium uppercase tracking-widest text-mute mb-4">
            Weight & calories (Health / manual)
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

      {!hasCronometer && healthSummary.length === 0 ? (
        <section className="rounded-xl border border-black/10 dark:border-white/10 p-6 text-mute">
          <p className="mb-2">No entries yet.</p>
          <p className="text-sm mb-4">
            Add Cronometer exports (<code className="text-ink bg-black/5 dark:bg-white/10 px-1 rounded">dailysummary.csv</code> and{" "}
            <code className="text-ink bg-black/5 dark:bg-white/10 px-1 rounded">servings.csv</code>) to{" "}
            <code className="text-ink bg-black/5 dark:bg-white/10 px-1 rounded">src/data/cronometer/</code>, or use Health Auto Export / health.json.
          </p>
          <SyncOptions />
        </section>
      ) : (
        <SyncOptions />
      )}
    </main>
  );
}
