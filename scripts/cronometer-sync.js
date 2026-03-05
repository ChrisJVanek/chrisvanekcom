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
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await page.waitForTimeout(2500);

    const emailSelectors = [
      () => page.locator('input[type="email"]'),
      () => page.getByPlaceholder(/email|e-mail/i),
      () => page.getByLabel(/email/i),
      () => page.getByRole("textbox", { name: /email/i }),
    ];
    let emailInput = null;
    for (const sel of emailSelectors) {
      try {
        const loc = sel().first();
        await loc.waitFor({ state: "visible", timeout: 5000 });
        emailInput = loc;
        break;
      } catch {
        continue;
      }
    }
    if (!emailInput) throw new Error("Could not find email input");
    await emailInput.click();
    await emailInput.fill(email, { force: true });
    await page.waitForTimeout(300);

    const passwordSelectors = [
      () => page.locator('input[type="password"]'),
      () => page.getByPlaceholder(/password/i),
      () => page.getByLabel(/password/i),
      () => page.getByRole("textbox", { name: /password/i }),
    ];
    let passwordInput = null;
    for (const sel of passwordSelectors) {
      try {
        const loc = sel().first();
        await loc.waitFor({ state: "visible", timeout: 5000 });
        passwordInput = loc;
        break;
      } catch {
        continue;
      }
    }
    if (!passwordInput) throw new Error("Could not find password input");
    await passwordInput.click();
    await passwordInput.fill(password, { force: true });
    await page.waitForTimeout(300);

    await page.getByRole("button", { name: /log in|login/i }).first().click();
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
    await page.waitForTimeout(3000);

    console.log("Re-opening Export Data for second export...");
    await page.getByRole("button", { name: /export data/i }).first().click({ timeout: 10000 });
    await page.waitForTimeout(2500);

    console.log("Exporting Food & recipe entries...");
    // Try: any clickable (button/link) containing "Food" and "Recipe" or "recipe entries"
    const foodSelectors = [
      () => page.getByRole("button", { name: /Food & Recipe Entries/i }).first(),
      () => page.getByRole("button", { name: /food.*recipe/i }).first(),
      () => page.locator("button").filter({ hasText: /food.*recipe/i }).first(),
      () => page.getByText(/export food.*recipe/i).first(),
    ];
    let foodBtn = null;
    for (const getLocator of foodSelectors) {
      try {
        const loc = getLocator();
        await loc.waitFor({ state: "visible", timeout: 12000 });
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
      page.waitForEvent("download", { timeout: 60000 }),
      foodBtn.click({ timeout: 30000, force: true }),
    ]);
    savePath = await download2.path();
    if (savePath && fs.existsSync(savePath)) {
      const dest = path.join(DATA_DIR, "servings.csv");
      fs.copyFileSync(savePath, dest);
      console.log("Saved servings.csv");
    }
    await page.waitForTimeout(2000);

    console.log("Re-opening Export Data for exercises...");
    await page.getByRole("button", { name: /export data/i }).first().click({ timeout: 10000 });
    await page.waitForTimeout(2500);

    console.log("Exporting Exercises...");
    const exerciseSelectors = [
      () => page.getByRole("button", { name: /Export Exercises/i }).first(),
      () => page.getByRole("button", { name: /exercises/i }).first(),
      () => page.locator("button").filter({ hasText: /export.*exercise/i }).first(),
    ];
    let exerciseBtn = null;
    for (const getLocator of exerciseSelectors) {
      try {
        const loc = getLocator();
        await loc.waitFor({ state: "visible", timeout: 8000 });
        exerciseBtn = loc;
        break;
      } catch {
        continue;
      }
    }
    if (exerciseBtn) {
      await exerciseBtn.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(800);
      const [download3] = await Promise.all([
        page.waitForEvent("download", { timeout: 60000 }),
        exerciseBtn.click({ timeout: 15000, force: true }),
      ]);
      const p3 = await download3.path();
      if (p3 && fs.existsSync(p3)) {
        fs.copyFileSync(p3, path.join(DATA_DIR, "exercises.csv"));
        console.log("Saved exercises.csv");
      }
    } else {
      console.log("Export Exercises button not found; skipping exercises.");
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
    const {
      parseDailyCsv,
      parseServingsCsv,
      parseExercisesCsv,
      mergeDaily,
      mergeServings,
      mergeExercises,
    } = require("./merge-cronometer-data.js");
    const { getCronometerFromDb, writeCronometerToDb } = require("./cronometer-db-write.js");
    const incomingDaily = parseDailyCsv(path.join(DATA_DIR, "dailysummary.csv"));
    const incomingServings = parseServingsCsv(path.join(DATA_DIR, "servings.csv"));
    const incomingExercises = parseExercisesCsv(path.join(DATA_DIR, "exercises.csv"));
    const existing = await getCronometerFromDb();
    const mergedDaily = mergeDaily(existing.mergedDaily, incomingDaily);
    const mergedServings = mergeServings(existing.mergedServings, incomingServings);
    const mergedExercises = mergeExercises(existing.mergedExercises || [], incomingExercises);
    await writeCronometerToDb(mergedDaily, mergedServings, mergedExercises);
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
