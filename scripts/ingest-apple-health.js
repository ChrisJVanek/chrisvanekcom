#!/usr/bin/env node
/**
 * Ingest Apple Health export.xml into src/data/health.json.
 * Usage: node scripts/ingest-apple-health.js [path/to/export.xml]
 *        Or unzip export.zip and pass the path to export.xml (or apple_health_export/export.xml).
 *
 * Extracts:
 *   - HKQuantityTypeIdentifierBodyMass -> weight (kg)
 *   - HKQuantityTypeIdentifierDietaryEnergyConsumed -> calories (kcal per day, summed)
 */

const fs = require("fs");
const path = require("path");
const sax = require("sax");

const BODY_MASS = "HKQuantityTypeIdentifierBodyMass";
const DIETARY_ENERGY = "HKQuantityTypeIdentifierDietaryEnergyConsumed";

const healthJsonPath = path.join(
  process.cwd(),
  "src",
  "data",
  "health.json"
);

function parseDate(str) {
  if (!str) return null;
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? match[0] : null;
}

function run(xmlPath) {
  if (!fs.existsSync(xmlPath)) {
    console.error("File not found:", xmlPath);
    process.exit(1);
  }

  const weightByDate = new Map(); // date -> kg (use latest of day if multiple)
  const caloriesByDate = new Map(); // date -> total kcal

  const stream = fs.createReadStream(xmlPath, { encoding: "utf8" });
  const parser = sax.createStream(true, { trim: true });

  parser.on("opentag", (node) => {
    if (node.name !== "Record") return;
    const type = node.attributes.type;
    const value = parseFloat(node.attributes.value, 10);
    const start = node.attributes.startDate || node.attributes.endDate;
    const date = parseDate(start);
    if (!date || isNaN(value)) return;

    if (type === BODY_MASS) {
      weightByDate.set(date, value);
    } else if (type === DIETARY_ENERGY) {
      const prev = caloriesByDate.get(date) || 0;
      caloriesByDate.set(date, prev + value);
    }
  });

  parser.on("error", (err) => {
    console.error("Parse error:", err.message);
    process.exit(1);
  });

  parser.on("end", () => {
    const weight = Array.from(weightByDate.entries())
      .map(([date, kg]) => ({ date, kg }))
      .sort((a, b) => (b.date > a.date ? 1 : -1));
    const calories = Array.from(caloriesByDate.entries())
      .map(([date, consumed]) => ({ date, consumed }))
      .sort((a, b) => (b.date > a.date ? 1 : -1));

    let existing = { weight: [], calories: [] };
    if (fs.existsSync(healthJsonPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(healthJsonPath, "utf-8"));
        existing.weight = Array.isArray(existing.weight) ? existing.weight : [];
        existing.calories = Array.isArray(existing.calories)
          ? existing.calories
          : [];
      } catch (_) {}
    }

    const mergeWeight = (a, b) => {
      const m = new Map(a.map((e) => [e.date, e.kg]));
      b.forEach((e) => m.set(e.date, e.kg));
      return Array.from(m.entries())
        .map(([date, kg]) => ({ date, kg }))
        .sort((x, y) => (y.date > x.date ? 1 : -1));
    };
    const mergeCalories = (a, b) => {
      const m = new Map(a.map((e) => [e.date, { ...e }]));
      b.forEach((e) => {
        const cur = m.get(e.date) || {};
        m.set(e.date, { date: e.date, consumed: e.consumed, goal: cur.goal });
      });
      return Array.from(m.values()).sort((x, y) =>
        y.date > x.date ? 1 : -1
      );
    };

    const out = {
      weight: mergeWeight(existing.weight, weight),
      calories: mergeCalories(existing.calories, calories),
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(healthJsonPath, JSON.stringify(out, null, 2), "utf-8");
    console.log(
      "Ingested:",
      weight.length,
      "weight entries,",
      calories.length,
      "calorie days. Written to",
      healthJsonPath
    );
  });

  stream.pipe(parser);
}

const xmlPath =
  process.argv[2] ||
  path.join(process.cwd(), "apple_health_export", "export.xml");
run(xmlPath);
