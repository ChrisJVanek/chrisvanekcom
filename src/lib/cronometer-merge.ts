/**
 * Merges new Cronometer export data into the stored JSON.
 * - No duplicate days: each date appears once in daily summary.
 * - For existing dates, incoming data replaces (so backdated/updated entries win).
 * - Servings: per day, incoming servings for a date replace existing for that date.
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import type { CronometerDailySummary, CronometerServing } from "./cronometer";

const dataDir = path.join(process.cwd(), "src", "data", "cronometer");
const dailyPath = path.join(dataDir, "cronometer-daily.json");
const servingsPath = path.join(dataDir, "cronometer-servings.json");

export interface StoredDaily {
  date: string;
  energyKcal: number;
  carbsG: number;
  fatG: number;
  proteinG: number;
  fiberG: number;
  sodiumMg: number;
}

export interface StoredServing {
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

function parseDailyCsv(csvPath: string): StoredDaily[] {
  if (!fs.existsSync(csvPath)) return [];
  const raw = fs.readFileSync(csvPath, "utf-8");
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
    .filter((r) => r.date);
}

function parseServingsCsv(csvPath: string): StoredServing[] {
  if (!fs.existsSync(csvPath)) return [];
  const raw = fs.readFileSync(csvPath, "utf-8");
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
    .filter((r) => r.foodName || r.energyKcal > 0);
}

function loadStoredDaily(): StoredDaily[] {
  if (!fs.existsSync(dailyPath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(dailyPath, "utf-8")) as StoredDaily[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function loadStoredServings(): StoredServing[] {
  if (!fs.existsSync(servingsPath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(servingsPath, "utf-8")) as StoredServing[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Merge new daily rows into stored. By date: new dates are added; existing dates
 * are replaced with incoming (so backdated/updated data wins).
 */
export function mergeDailySummaries(
  existing: StoredDaily[],
  incoming: StoredDaily[]
): StoredDaily[] {
  const byDate = new Map<string, StoredDaily>();
  for (const row of existing) byDate.set(row.date, row);
  for (const row of incoming) byDate.set(row.date, row);
  return Array.from(byDate.values()).sort((a, b) => (b.date > a.date ? 1 : -1));
}

/**
 * Merge new servings into stored. Per day: incoming servings for a date replace
 * all existing servings for that date (so backdated/updated day wins).
 */
export function mergeServings(
  existing: StoredServing[],
  incoming: StoredServing[]
): StoredServing[] {
  const byDay = new Map<string, StoredServing[]>();
  for (const s of existing) {
    const list = byDay.get(s.day) ?? [];
    list.push(s);
    byDay.set(s.day, list);
  }
  // Incoming overwrites entire day when that day appears in incoming
  const incomingByDay = new Map<string, StoredServing[]>();
  for (const s of incoming) {
    const list = incomingByDay.get(s.day) ?? [];
    list.push(s);
    incomingByDay.set(s.day, list);
  }
  for (const [day, list] of Array.from(incomingByDay.entries())) byDay.set(day, list);

  const result: StoredServing[] = [];
  for (const day of Array.from(byDay.keys()).sort((a, b) => (b > a ? 1 : -1))) {
    result.push(...(byDay.get(day) ?? []));
  }
  return result.sort((a, b) => {
    if (a.day !== b.day) return b.day > a.day ? 1 : -1;
    return (b.time || "").localeCompare(a.time || "");
  });
}

/**
 * Read new CSVs from dataDir (dailysummary.csv, servings.csv), merge into
 * cronometer-daily.json and cronometer-servings.json. Idempotent: no duplicate
 * days; existing dates are updated from incoming.
 */
export function mergeCronometerDataFromCsv(): {
  dailyCount: number;
  servingsCount: number;
} {
  const dailyCsv = path.join(dataDir, "dailysummary.csv");
  const servingsCsv = path.join(dataDir, "servings.csv");

  const incomingDaily = parseDailyCsv(dailyCsv);
  const incomingServings = parseServingsCsv(servingsCsv);

  const existingDaily = loadStoredDaily();
  const existingServings = loadStoredServings();

  const mergedDaily = mergeDailySummaries(existingDaily, incomingDaily);
  const mergedServings = mergeServings(existingServings, incomingServings);

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    dailyPath,
    JSON.stringify(mergedDaily, null, 2),
    "utf-8"
  );
  fs.writeFileSync(
    servingsPath,
    JSON.stringify(mergedServings, null, 2),
    "utf-8"
  );

  return { dailyCount: mergedDaily.length, servingsCount: mergedServings.length };
}
