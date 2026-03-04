import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const dataDir = path.join(process.cwd(), "src", "data", "cronometer");
const dailyJsonPath = path.join(dataDir, "cronometer-daily.json");
const servingsJsonPath = path.join(dataDir, "cronometer-servings.json");
const metaPath = path.join(dataDir, "cronometer-meta.json");

export interface CronometerDailySummary {
  date: string;
  energyKcal: number;
  carbsG: number;
  fatG: number;
  proteinG: number;
  fiberG: number;
  sodiumMg: number;
}

export interface CronometerServing {
  day: string;
  time: string;
  group: string;
  foodName: string;
  amount: string;
  energyKcal: number;
  category: string;
}

function num(val: string | undefined): number {
  if (val == null || val === "") return 0;
  const n = parseFloat(String(val).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function getCronometerDailySummaries(): CronometerDailySummary[] {
  if (fs.existsSync(dailyJsonPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dailyJsonPath, "utf-8")) as CronometerDailySummary[];
      return Array.isArray(data) ? data : [];
    } catch {
      // fall through to CSV
    }
  }
  const file = path.join(dataDir, "dailysummary.csv");
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf-8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as Record<string, string>[];
  return rows
    .map((r) => ({
      date: r["Date"] ?? "",
      energyKcal: num(r["Energy (kcal)"]),
      carbsG: num(r["Carbs (g)"]),
      fatG: num(r["Fat (g)"]),
      proteinG: num(r["Protein (g)"]),
      fiberG: num(r["Fiber (g)"]),
      sodiumMg: num(r["Sodium (mg)"]),
    }))
    .filter((r) => r.date)
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}

export function getCronometerServings(): CronometerServing[] {
  if (fs.existsSync(servingsJsonPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(servingsJsonPath, "utf-8")) as CronometerServing[];
      return Array.isArray(data) ? data : [];
    } catch {
      // fall through to CSV
    }
  }
  const file = path.join(dataDir, "servings.csv");
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf-8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as Record<string, string>[];
  return rows
    .map((r) => ({
      day: r["Day"] ?? "",
      time: r["Time"] ?? "",
      group: r["Group"] ?? "",
      foodName: r["Food Name"] ?? "",
      amount: r["Amount"] ?? "",
      energyKcal: num(r["Energy (kcal)"]),
      category: r["Category"] ?? "",
    }))
    .filter((r) => r.foodName || r.energyKcal > 0)
    .sort((a, b) => {
      if (a.day !== b.day) return b.day > a.day ? 1 : -1;
      return (b.time || "").localeCompare(a.time || "");
    });
}

/** ISO string when Cronometer data was last updated (from merge or meta file). */
export function getCronometerUpdatedAt(): string | null {
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as { updatedAt?: string };
      if (meta.updatedAt) return meta.updatedAt;
    } catch {
      // fall through
    }
  }
  let mtime: Date | null = null;
  if (fs.existsSync(dailyJsonPath)) {
    const s = fs.statSync(dailyJsonPath);
    if (!mtime || s.mtime > mtime) mtime = s.mtime;
  }
  if (fs.existsSync(servingsJsonPath)) {
    const s = fs.statSync(servingsJsonPath);
    if (!mtime || s.mtime > mtime) mtime = s.mtime;
  }
  return mtime ? mtime.toISOString() : null;
}
