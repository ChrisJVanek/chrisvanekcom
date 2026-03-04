#!/usr/bin/env node
/**
 * Cronometer sync: log in, export last 7 days (daily nutrition + food entries),
 * save CSVs to src/data/cronometer/, then merge into JSON store.
 *
 * Requires: CRONOMETER_EMAIL, CRONOMETER_PASSWORD in env.
 * Usage: node scripts/cronometer-sync.js [--headed]
 */

const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

require("dotenv").config({ path: path.join(process.cwd(), ".env") });

const DATA_DIR = path.join(process.cwd(), "src", "data", "cronometer");
const LOGIN_URL = "https://cronometer.com/login/";
const ACCOUNT_URL = "https://cronometer.com/#account";

async function main() {
  const email = process.env.CRONOMETER_EMAIL;
  const password = process.env.CRONOMETER_PASSWORD;
  if (!email || !password) {
    console.error("Set CRONOMETER_EMAIL and CRONOMETER_PASSWORD in the environment.");
    process.exit(1);
  }

  const headed = process.argv.includes("--headed");
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: !headed,
    channel: "chrome",
  }).catch(() => chromium.launch({ headless: !headed }));

  const context = await browser.newContext({
    acceptDownloads: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    console.log("Logging in...");
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle").catch(() => {});

    await page.getByRole("textbox", { name: /email/i }).fill(email);
    await page.getByRole("textbox", { name: /password/i }).fill(password);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForTimeout(5000);

    console.log("Going to account / export...");
    await page.goto(ACCOUNT_URL, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(3000);

    console.log("Opening Export Data...");
    await page.getByRole("button", { name: /export data/i }).first().click({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Set date range to last 7 days if visible
    try {
      const last7 = page.getByRole("button", { name: /last 7|7 days/i }).first();
      await last7.click({ timeout: 5000 });
      await page.waitForTimeout(1000);
    } catch {
      try {
        await page.getByText(/last 7 days|past 7 days/i).first().click({ timeout: 3000 });
        await page.waitForTimeout(1000);
      } catch {
        // continue without changing date range
      }
    }

    console.log("Exporting daily nutrition...");
    const dailyBtn = page.getByRole("button", { name: /export daily nutrition|daily nutrition/i }).first();
    const [download1] = await Promise.all([
      page.waitForEvent("download", { timeout: 20000 }),
      dailyBtn.click({ timeout: 10000 }),
    ]);
    let savePath = await download1.path();
    if (savePath && fs.existsSync(savePath)) {
      const dest = path.join(DATA_DIR, "dailysummary.csv");
      fs.copyFileSync(savePath, dest);
      console.log("Saved dailysummary.csv");
    }
    // Wait for first download to finish and export panel to be ready for second button
    await page.waitForTimeout(5000);

    console.log("Exporting Food & recipe entries...");
    // Try: second "Export ..." button by index, then various text/role selectors
    const foodSelectors = [
      () => page.getByRole("button", { name: /export/i }).nth(1),
      () => page.getByRole("button", { name: /export food|food & recipe|recipe entries/i }).first(),
      () => page.getByRole("button", { name: /food.*recipe|recipe.*entries/i }).first(),
      () => page.getByText(/export food|food & recipe entries/i).first(),
      () => page.getByText(/food.*recipe.*entries/i).first(),
    ];
    let foodBtn = null;
    for (const getLocator of foodSelectors) {
      try {
        const loc = getLocator();
        await loc.waitFor({ state: "visible", timeout: 15000 });
        foodBtn = loc;
        break;
      } catch {
        continue;
      }
    }
    if (!foodBtn) {
      throw new Error("Could not find 'Export Food & recipe entries' button. Selectors may need updating.");
    }
    await foodBtn.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(800);
    const [download2] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      foodBtn.click({ timeout: 30000, force: true }),
    ]);
    savePath = await download2.path();
    if (savePath && fs.existsSync(savePath)) {
      const dest = path.join(DATA_DIR, "servings.csv");
      fs.copyFileSync(savePath, dest);
      console.log("Saved servings.csv");
    }
  } catch (err) {
    console.error("Sync error:", err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }

  // Merge: write to DB if DATABASE_URL set (dynamic), else to JSON files (legacy)
  const useDb = !!process.env.DATABASE_URL;
  if (useDb) {
    const { parseDailyCsv, parseServingsCsv, mergeDaily, mergeServings } = require("./merge-cronometer-data.js");
    const { getCronometerFromDb, writeCronometerToDb } = require("./cronometer-db-write.js");
    const incomingDaily = parseDailyCsv(path.join(DATA_DIR, "dailysummary.csv"));
    const incomingServings = parseServingsCsv(path.join(DATA_DIR, "servings.csv"));
    const existing = await getCronometerFromDb();
    const mergedDaily = mergeDaily(existing.mergedDaily, incomingDaily);
    const mergedServings = mergeServings(existing.mergedServings, incomingServings);
    await writeCronometerToDb(mergedDaily, mergedServings);
  } else {
    const { run } = require("./merge-cronometer-data.js");
    run();
  }
  console.log("Cronometer sync done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
