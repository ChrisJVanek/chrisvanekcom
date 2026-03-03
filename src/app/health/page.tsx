import Link from "next/link";
import { getHealthData, getDailySummary } from "@/lib/health";

function SyncOptions() {
  const ingestUrl = "https://chrisvanek.com/api/health/ingest";
  return (
    <section className="mt-8 rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm text-mute">
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
