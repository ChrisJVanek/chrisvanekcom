import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type {
  HealthData,
  WeightEntry,
  CalorieEntry,
  ActivityEntry,
  StepsEntry,
  CaloriesBurnedEntry,
} from "@/lib/health";

const dataPath = path.join(process.cwd(), "src", "data", "health.json");

/** Health Auto Export metric: { name, units, data: [{ qty, date }] } */
type HAEMetric = { name?: string; units?: string; data?: Array<{ qty?: number; date?: string }> };

function parseDateOnly(dateStr: string): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? match[0] : null;
}

const EXERCISE_MINUTE_METRICS = [
  "apple_exercise_time",
  "exercise_minutes",
  "exercise_time",
];

const STEP_METRICS = ["step_count", "steps", "hkquantitytypeidentifierstepcount"];

function fromHealthAutoExport(body: { data?: { metrics?: HAEMetric[] } }): {
  weight: WeightEntry[];
  calories: CalorieEntry[];
  activity: ActivityEntry[];
  steps: StepsEntry[];
  caloriesBurned: CaloriesBurnedEntry[];
} {
  const weight: WeightEntry[] = [];
  const caloriesByDate = new Map<string, number>();
  const activityByDate = new Map<string, number>();
  const stepsByDate = new Map<string, number>();
  const burnedByDate = new Map<string, number>();
  const metrics = body.data?.metrics;
  if (!Array.isArray(metrics))
    return { weight, calories: [], activity: [], steps: [], caloriesBurned: [] };

  for (const m of metrics) {
    const name = (m.name || "").toLowerCase().replace(/\s+/g, "_");
    const points = Array.isArray(m.data) ? m.data : [];
    for (const p of points) {
      const date = parseDateOnly(p.date || "");
      const qty = typeof p.qty === "number" ? p.qty : undefined;
      if (!date || qty == null) continue;
      if (name === "weight_body_mass") {
        weight.push({ date, kg: qty });
      } else if (name === "dietary_energy") {
        const prev = caloriesByDate.get(date) || 0;
        caloriesByDate.set(date, prev + qty);
      } else if (EXERCISE_MINUTE_METRICS.some((n) => name === n || name.includes("exercise_time") || name.includes("exercise_minutes"))) {
        const prev = activityByDate.get(date) || 0;
        activityByDate.set(date, prev + Math.round(qty));
      } else if (name === "active_energy_burned" || name.includes("active_energy")) {
        const prev = burnedByDate.get(date) || 0;
        burnedByDate.set(date, prev + Math.round(qty));
      } else if (STEP_METRICS.some((n) => name === n || name.includes("step"))) {
        const prev = stepsByDate.get(date) || 0;
        stepsByDate.set(date, prev + Math.round(qty));
      }
    }
  }
  const calories: CalorieEntry[] = Array.from(caloriesByDate.entries())
    .map(([date, consumed]) => ({ date, consumed }))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
  const activity: ActivityEntry[] = Array.from(activityByDate.entries())
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
  const steps: StepsEntry[] = Array.from(stepsByDate.entries())
    .map(([date, count]) => ({ date, steps: count }))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
  const caloriesBurned: CaloriesBurnedEntry[] = Array.from(burnedByDate.entries())
    .map(([date, kcal]) => ({ date, kcal }))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
  return { weight, calories, activity, steps, caloriesBurned };
}

function loadData(): HealthData {
  if (!fs.existsSync(dataPath))
    return { weight: [], calories: [], activity: [], steps: [], caloriesBurned: [] };
  const raw = fs.readFileSync(dataPath, "utf-8");
  try {
    const d = JSON.parse(raw) as HealthData;
    return {
      weight: Array.isArray(d.weight) ? d.weight : [],
      calories: Array.isArray(d.calories) ? d.calories : [],
      activity: Array.isArray(d.activity) ? d.activity : [],
      steps: Array.isArray(d.steps) ? d.steps : [],
      caloriesBurned: Array.isArray(d.caloriesBurned) ? d.caloriesBurned : [],
      updatedAt: d.updatedAt,
    };
  } catch {
    return { weight: [], calories: [], activity: [], steps: [], caloriesBurned: [] };
  }
}

function mergeWeight(existing: WeightEntry[], incoming: WeightEntry[]): WeightEntry[] {
  const byDate = new Map<string, number>();
  for (const e of existing) byDate.set(e.date, e.kg);
  for (const e of incoming) byDate.set(e.date, e.kg);
  return Array.from(byDate.entries())
    .map(([date, kg]) => ({ date, kg }))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}

function mergeCalories(
  existing: CalorieEntry[],
  incoming: CalorieEntry[]
): CalorieEntry[] {
  const byDate = new Map<string, CalorieEntry>();
  for (const e of existing) byDate.set(e.date, e);
  for (const e of incoming) {
    const key = e.date;
    byDate.set(key, { ...byDate.get(key), ...e });
  }
  return Array.from(byDate.values()).sort((a, b) =>
    b.date > a.date ? 1 : -1
  );
}

function mergeActivity(
  existing: ActivityEntry[],
  incoming: ActivityEntry[]
): ActivityEntry[] {
  const byDate = new Map<string, number>();
  for (const e of existing) byDate.set(e.date, e.minutes);
  for (const e of incoming) byDate.set(e.date, e.minutes);
  return Array.from(byDate.entries())
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}

function mergeSteps(existing: StepsEntry[], incoming: StepsEntry[]): StepsEntry[] {
  const byDate = new Map<string, number>();
  for (const e of existing) byDate.set(e.date, e.steps);
  for (const e of incoming) byDate.set(e.date, e.steps);
  return Array.from(byDate.entries())
    .map(([date, steps]) => ({ date, steps }))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}

function mergeCaloriesBurned(
  existing: CaloriesBurnedEntry[],
  incoming: CaloriesBurnedEntry[]
): CaloriesBurnedEntry[] {
  const byDate = new Map<string, number>();
  for (const e of existing) byDate.set(e.date, e.kcal);
  for (const e of incoming) byDate.set(e.date, e.kcal);
  return Array.from(byDate.entries())
    .map(([date, kcal]) => ({ date, kcal }))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.HEALTH_INGEST_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    weight?: WeightEntry[];
    calories?: CalorieEntry[];
    activity?: ActivityEntry[];
    steps?: StepsEntry[];
    caloriesBurned?: CaloriesBurnedEntry[];
    data?: { metrics?: HAEMetric[] };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const data = loadData();

  if (body.data?.metrics) {
    const { weight: w, calories: c, activity: a, steps: s, caloriesBurned: b } =
      fromHealthAutoExport(body);
    if (w.length) data.weight = mergeWeight(data.weight, w);
    if (c.length) data.calories = mergeCalories(data.calories, c);
    if (a.length) data.activity = mergeActivity(data.activity, a);
    if (s.length) data.steps = mergeSteps(data.steps ?? [], s);
    if (b.length) data.caloriesBurned = mergeCaloriesBurned(data.caloriesBurned ?? [], b);
  } else {
    if (body.weight?.length) data.weight = mergeWeight(data.weight, body.weight);
    if (body.calories?.length) data.calories = mergeCalories(data.calories, body.calories);
    if (body.activity?.length) data.activity = mergeActivity(data.activity, body.activity);
    if (body.steps?.length) data.steps = mergeSteps(data.steps ?? [], body.steps);
    if (body.caloriesBurned?.length)
      data.caloriesBurned = mergeCaloriesBurned(data.caloriesBurned ?? [], body.caloriesBurned);
  }

  data.updatedAt = new Date().toISOString();

  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to write data" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, updatedAt: data.updatedAt });
}
