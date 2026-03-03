#!/usr/bin/env node
/**
 * Merges dailysummary.csv and servings.csv into cronometer-daily.json and
 * cronometer-servings.json. No duplicate days; existing dates are replaced
 * by incoming data (backdated/updated wins).
 * Run after cronometer-sync.js downloads new CSVs.
 */

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const dataDir = path.join(process.cwd(), "src", "data", "cronometer");
const dailyPath = path.join(dataDir, "cronometer-daily.json");
const servingsPath = path.join(dataDir, "cronometer-servings.json");

function num(val) {
  if (val == null || val === "") return 0;
  const n = parseFloat(String(val).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseDailyCsv(csvPath) {
  if (!fs.existsSync(csvPath)) return [];
  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });
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

function parseServingsCsv(csvPath) {
  if (!fs.existsSync(csvPath)) return [];
  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });
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

function loadStored(path) {
  if (!fs.existsSync(path)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(path, "utf-8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function mergeDaily(existing, incoming) {
  const byDate = new Map();
  for (const row of existing) byDate.set(row.date, row);
  for (const row of incoming) byDate.set(row.date, row);
  return Array.from(byDate.values()).sort((a, b) => (b.date > a.date ? 1 : -1));
}

function mergeServings(existing, incoming) {
  const byDay = new Map();
  for (const s of existing) {
    const list = byDay.get(s.day) ?? [];
    list.push(s);
    byDay.set(s.day, list);
  }
  const incomingByDay = new Map();
  for (const s of incoming) {
    const list = incomingByDay.get(s.day) ?? [];
    list.push(s);
    incomingByDay.set(s.day, list);
  }
  for (const [day, list] of incomingByDay) byDay.set(day, list);
  const result = [];
  for (const day of Array.from(byDay.keys()).sort((a, b) => (b > a ? 1 : -1))) {
    result.push(...(byDay.get(day) ?? []));
  }
  return result.sort((a, b) => {
    if (a.day !== b.day) return b.day > a.day ? 1 : -1;
    return (b.time || "").localeCompare(a.time || "");
  });
}

function run() {
  const dailyCsv = path.join(dataDir, "dailysummary.csv");
  const servingsCsv = path.join(dataDir, "servings.csv");

  const incomingDaily = parseDailyCsv(dailyCsv);
  const incomingServings = parseServingsCsv(servingsCsv);

  const existingDaily = loadStored(dailyPath);
  const existingServings = loadStored(servingsPath);

  const mergedDaily = mergeDaily(existingDaily, incomingDaily);
  const mergedServings = mergeServings(existingServings, incomingServings);

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dailyPath, JSON.stringify(mergedDaily, null, 2), "utf-8");
  fs.writeFileSync(servingsPath, JSON.stringify(mergedServings, null, 2), "utf-8");

  console.log(
    "Merged:",
    mergedDaily.length,
    "daily summaries,",
    mergedServings.length,
    "servings."
  );
  return { dailyCount: mergedDaily.length, servingsCount: mergedServings.length };
}

if (require.main === module) {
  run();
} else {
  module.exports = { run };
}
