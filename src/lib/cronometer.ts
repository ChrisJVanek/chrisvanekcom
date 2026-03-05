import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/db";

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

function getDailyFromFiles(): CronometerDailySummary[] {
  const fromCsv = (): CronometerDailySummary[] => {
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
  };
  if (fs.existsSync(dailyJsonPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dailyJsonPath, "utf-8")) as CronometerDailySummary[];
      const fromJson = Array.isArray(data) ? data : [];
      const csvRows = fromCsv();
      // Prefer CSV when it has more days (e.g. repo has fresh export, JSON is stale)
      if (csvRows.length > fromJson.length) return csvRows;
      if (fromJson.length > 0) return fromJson;
    } catch {
      // fall through to CSV
    }
  }
  return fromCsv();
}

function getServingsFromFiles(): CronometerServing[] {
  const fromCsv = (): CronometerServing[] => {
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
  };
  if (fs.existsSync(servingsJsonPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(servingsJsonPath, "utf-8")) as CronometerServing[];
      const fromJson = Array.isArray(data) ? data : [];
      const csvRows = fromCsv();
      if (csvRows.length > fromJson.length) return csvRows;
      if (fromJson.length > 0) return fromJson;
    } catch {
      // fall through
    }
  }
  return fromCsv();
}

/** Cronometer daily summaries: from DB when DATABASE_URL is set, else from files. */
export async function getCronometerDailySummaries(): Promise<CronometerDailySummary[]> {
  if (process.env.DATABASE_URL) {
    try {
      const rows = await prisma.cronometerDaily.findMany({
        orderBy: { date: "desc" },
      });
      return rows.map((r) => ({
        date: r.date,
        energyKcal: r.energyKcal,
        carbsG: r.carbsG,
        fatG: r.fatG,
        proteinG: r.proteinG,
        fiberG: r.fiberG,
        sodiumMg: r.sodiumMg,
      }));
    } catch {
      return getDailyFromFiles();
    }
  }
  return getDailyFromFiles();
}

/** Cronometer servings: from DB when DATABASE_URL is set, else from files. */
export async function getCronometerServings(): Promise<CronometerServing[]> {
  if (process.env.DATABASE_URL) {
    try {
      const rows = await prisma.cronometerServing.findMany({
        orderBy: [{ day: "desc" }, { time: "desc" }],
      });
      return rows.map((r) => ({
        day: r.day,
        time: r.time ?? "",
        group: r.group ?? "",
        foodName: r.foodName,
        amount: r.amount ?? "",
        energyKcal: r.energyKcal,
        category: r.category ?? "",
      }));
    } catch {
      return getServingsFromFiles();
    }
  }
  return getServingsFromFiles();
}

/** Cronometer exercise minutes (and optional calories burned) by date; from DB when DATABASE_URL is set. */
export async function getCronometerActivity(): Promise<
  Array<{ date: string; minutes: number; caloriesBurned?: number }>
> {
  if (process.env.DATABASE_URL) {
    try {
      const rows = await prisma.cronometerExercise.findMany({
        orderBy: { date: "desc" },
      });
      return rows.map((r) => ({
        date: r.date,
        minutes: r.minutes,
        caloriesBurned: r.caloriesBurned ?? undefined,
      }));
    } catch {
      return [];
    }
  }
  return [];
}

/** ISO string when Cronometer data was last updated (DB meta or file). */
export async function getCronometerUpdatedAt(): Promise<string | null> {
  if (process.env.DATABASE_URL) {
    try {
      const meta = await prisma.cronometerMeta.findUnique({
        where: { key: "updatedAt" },
      });
      if (meta?.value) return meta.value;
    } catch {
      // fall through
    }
  }
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as { updatedAt?: string };
      if (meta.updatedAt) return meta.updatedAt;
    } catch {
      // fall through
    }
  }
  const mtimes: Date[] = [];
  if (fs.existsSync(dailyJsonPath)) mtimes.push(fs.statSync(dailyJsonPath).mtime);
  if (fs.existsSync(servingsJsonPath)) mtimes.push(fs.statSync(servingsJsonPath).mtime);
  if (mtimes.length === 0) return null;
  const latest = new Date(Math.max(...mtimes.map((d) => d.getTime())));
  return latest.toISOString();
}
