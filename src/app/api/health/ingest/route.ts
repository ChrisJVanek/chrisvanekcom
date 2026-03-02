import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { HealthData, WeightEntry, CalorieEntry } from "@/lib/health";

const dataPath = path.join(process.cwd(), "src", "data", "health.json");

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
  const byDate = new Map<string | number, CalorieEntry>();
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

  let body: { weight?: WeightEntry[]; calories?: CalorieEntry[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const data = loadData();
  if (body.weight?.length) {
    data.weight = mergeWeight(data.weight, body.weight);
  }
  if (body.calories?.length) {
    data.calories = mergeCalories(data.calories, body.calories);
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
