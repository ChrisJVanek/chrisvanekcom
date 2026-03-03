import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { HealthData, WeightEntry, CalorieEntry } from "@/lib/health";

const dataPath = path.join(process.cwd(), "src", "data", "health.json");

/** Health Auto Export metric: { name, units, data: [{ qty, date }] } */
type HAEMetric = { name?: string; units?: string; data?: Array<{ qty?: number; date?: string }> };

function parseDateOnly(dateStr: string): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? match[0] : null;
}

function fromHealthAutoExport(body: { data?: { metrics?: HAEMetric[] } }): {
  weight: WeightEntry[];
  calories: CalorieEntry[];
} {
  const weight: WeightEntry[] = [];
  const caloriesByDate = new Map<string, number>();
  const metrics = body.data?.metrics;
  if (!Array.isArray(metrics)) return { weight, calories: [] };

  for (const m of metrics) {
    const name = (m.name || "").toLowerCase();
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
      }
    }
  }
  const calories: CalorieEntry[] = Array.from(caloriesByDate.entries())
    .map(([date, consumed]) => ({ date, consumed }))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
  return { weight, calories };
}

function loadData(): HealthData {
  if (!fs.existsSync(dataPath)) return { weight: [], calories: [] };
  const raw = fs.readFileSync(dataPath, "utf-8");
  try {
    const d = JSON.parse(raw) as HealthData;
    return {
      weight: Array.isArray(d.weight) ? d.weight : [],
      calories: Array.isArray(d.calories) ? d.calories : [],
      updatedAt: d.updatedAt,
    };
  } catch {
    return { weight: [], calories: [] };
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

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.HEALTH_INGEST_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { weight?: WeightEntry[]; calories?: CalorieEntry[]; data?: { metrics?: HAEMetric[] } };
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
    const { weight: w, calories: c } = fromHealthAutoExport(body);
    if (w.length) data.weight = mergeWeight(data.weight, w);
    if (c.length) data.calories = mergeCalories(data.calories, c);
  } else {
    if (body.weight?.length) data.weight = mergeWeight(data.weight, body.weight);
    if (body.calories?.length) data.calories = mergeCalories(data.calories, body.calories);
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
