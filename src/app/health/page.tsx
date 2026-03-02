import Link from "next/link";
import { getHealthData, getDailySummary } from "@/lib/health";

function SyncOptions() {
  return (
    <section className="mt-8 rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm text-mute">
      <h3 className="font-display font-medium text-ink mb-2">Sync from Apple Health</h3>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <strong>Export file:</strong> In Health app, tap profile → Export All Health Data. Unzip, then run{" "}
          <code className="text-ink bg-black/5 dark:bg-white/10 px-1 rounded">npm run health:ingest-apple path/to/apple_health_export/export.xml</code> to merge weight and dietary calories into this data.
        </li>
        <li>
          <strong>API:</strong> POST to <code className="text-ink bg-black/5 dark:bg-white/10 px-1 rounded">/api/health/ingest</code> with header <code className="text-ink bg-black/5 dark:bg-white/10 px-1 rounded">Authorization: Bearer YOUR_SECRET</code> (env: <code className="text-ink bg-black/5 dark:bg-white/10 px-1 rounded">HEALTH_INGEST_SECRET</code>). Body: weight and/or calories arrays with date, kg, consumed. Works with Health Auto Export or an iOS Shortcut that POSTs Health data.
        </li>
      </ul>
    </section>
  );
}

export const metadata = {
  title: "Health",
  description: "Weight and calorie tracking, synced from MyFitnessPal or Apple Health.",
};

export default function HealthPage() {
  const data = getHealthData();
  const summary = getDailySummary(data);

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
          Weight and daily calories. Data from MyFitnessPal, Apple Health, or
          manual edits to <code className="text-ink bg-black/5 dark:bg-white/10 px-1 rounded">src/data/health.json</code>.
        </p>
      </header>

      {summary.length === 0 ? (
        <section className="rounded-lg border border-black/10 dark:border-white/10 p-6 text-mute">
          <p className="mb-2">No entries yet.</p>
          <p className="text-sm mb-4">
            Add weight and calorie entries to{" "}
            <code className="text-ink bg-black/5 dark:bg-white/10 px-1 rounded">src/data/health.json</code>, or
            sync from Apple Health (see below), or export from MyFitnessPal and convert.
          </p>
          <SyncOptions />
        </section>
      ) : (
        <>
          <section className="mb-10">
            <h2 className="font-display text-sm font-medium uppercase tracking-widest text-mute mb-4">
              Daily summary
            </h2>
            <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10">
                    <th className="font-display font-medium text-ink py-3 px-4">
                      Date
                    </th>
                    <th className="font-display font-medium text-ink py-3 px-4">
                      Weight (kg)
                    </th>
                    <th className="font-display font-medium text-ink py-3 px-4">
                      Calories
                    </th>
                    <th className="font-display font-medium text-ink py-3 px-4">
                      vs goal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row) => (
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
                            <span className="text-green-600 dark:text-green-400">
                              under
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400">
                              over
                            </span>
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
          </section>

          {data.updatedAt && (
            <p className="text-xs text-mute mb-10">
              Last updated:{" "}
              {new Date(data.updatedAt).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </p>
          )}
          <SyncOptions />
        </>
      )}
    </main>
  );
}
