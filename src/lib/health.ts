import fs from "fs";
import path from "path";

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  kg: number;
}

export interface CalorieEntry {
  date: string;
  consumed: number;
  goal?: number;
}

export interface HealthData {
  weight: WeightEntry[];
  calories: CalorieEntry[];
  updatedAt?: string; // ISO string, e.g. from MFP export
}

const dataPath = path.join(process.cwd(), "src", "data", "health.json");

export function getHealthData(): HealthData {
  if (!fs.existsSync(dataPath)) {
    return { weight: [], calories: [] };
  }
  const raw = fs.readFileSync(dataPath, "utf-8");
  try {
    const data = JSON.parse(raw) as HealthData;
    return {
      weight: Array.isArray(data.weight) ? data.weight : [],
      calories: Array.isArray(data.calories) ? data.calories : [],
      updatedAt: data.updatedAt,
    };
  } catch {
    return { weight: [], calories: [] };
  }
}

/** Merge entries by date for display (most recent first) */
export function getDailySummary(data: HealthData): Array<{
  date: string;
  weight?: number;
  consumed?: number;
  goal?: number;
}> {
  const byDate = new Map<
    string,
    { weight?: number; consumed?: number; goal?: number }
  >();
  for (const w of data.weight) {
    byDate.set(w.date, { ...byDate.get(w.date), weight: w.kg });
  }
  for (const c of data.calories) {
    const existing = byDate.get(c.date) ?? {};
    byDate.set(c.date, {
      ...existing,
      consumed: c.consumed,
      goal: c.goal,
    });
  }
  const entries = Array.from(byDate.entries())
    .map(([date, rest]) => ({ date, ...rest }))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
  return entries;
}
