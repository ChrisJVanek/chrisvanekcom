#!/usr/bin/env node
/**
 * Writes merged Cronometer data to PostgreSQL (Prisma).
 * Requires DATABASE_URL and Prisma client generated (npx prisma generate).
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Load existing Cronometer data from DB for merging with incoming export.
 */
async function getCronometerFromDb() {
  await prisma.$connect();
  try {
    const [dailyRows, servingRows, exerciseRows] = await Promise.all([
      prisma.cronometerDaily.findMany({ orderBy: { date: "desc" } }),
      prisma.cronometerServing.findMany({ orderBy: [{ day: "desc" }, { time: "desc" }] }),
      prisma.cronometerExercise.findMany({ orderBy: { date: "desc" } }).catch(() => []),
    ]);
    const mergedDaily = dailyRows.map((r) => ({
      date: r.date,
      energyKcal: r.energyKcal,
      carbsG: r.carbsG,
      fatG: r.fatG,
      proteinG: r.proteinG,
      fiberG: r.fiberG,
      sodiumMg: r.sodiumMg,
    }));
    const mergedServings = servingRows.map((r) => ({
      day: r.day,
      time: r.time || "",
      group: r.group || "",
      foodName: r.foodName,
      amount: r.amount || "",
      energyKcal: r.energyKcal,
      category: r.category || "",
    }));
    const mergedExercises = Array.isArray(exerciseRows)
      ? exerciseRows.map((r) => ({
          date: r.date,
          minutes: r.minutes,
          caloriesBurned: r.caloriesBurned ?? 0,
        }))
      : [];
    return { mergedDaily, mergedServings, mergedExercises };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * @param {Array<{ date: string, energyKcal: number, ... }>} mergedDaily
 * @param {Array<{ day: string, time: string, foodName: string, ... }>} mergedServings
 * @param {Array<{ date: string, minutes: number, caloriesBurned?: number }>} mergedExercises
 */
async function writeCronometerToDb(mergedDaily, mergedServings, mergedExercises = []) {
  await prisma.$connect();

  try {
    for (const row of mergedDaily) {
      await prisma.cronometerDaily.upsert({
        where: { date: row.date },
        create: {
          date: row.date,
          energyKcal: row.energyKcal,
          carbsG: row.carbsG,
          fatG: row.fatG,
          proteinG: row.proteinG,
          fiberG: row.fiberG,
          sodiumMg: row.sodiumMg,
        },
        update: {
          energyKcal: row.energyKcal,
          carbsG: row.carbsG,
          fatG: row.fatG,
          proteinG: row.proteinG,
          fiberG: row.fiberG,
          sodiumMg: row.sodiumMg,
        },
      });
    }

    const daysInServings = [...new Set(mergedServings.map((s) => s.day))];
    if (daysInServings.length > 0) {
      await prisma.cronometerServing.deleteMany({
        where: { day: { in: daysInServings } },
      });
    }

    if (mergedServings.length > 0) {
      await prisma.cronometerServing.createMany({
        data: mergedServings.map((s) => ({
          day: s.day,
          time: s.time || null,
          group: s.group || null,
          foodName: s.foodName,
          amount: s.amount || null,
          energyKcal: s.energyKcal,
          category: s.category || null,
        })),
      });
    }

    for (const row of mergedExercises) {
      await prisma.cronometerExercise.upsert({
        where: { date: row.date },
        create: {
          date: row.date,
          minutes: row.minutes,
          caloriesBurned: row.caloriesBurned ?? null,
        },
        update: {
          minutes: row.minutes,
          caloriesBurned: row.caloriesBurned ?? null,
        },
      });
    }

    const now = new Date().toISOString();
    await prisma.cronometerMeta.upsert({
      where: { key: "updatedAt" },
      create: { key: "updatedAt", value: now },
      update: { value: now },
    });

    console.log(
      "Written to database:",
      mergedDaily.length,
      "daily,",
      mergedServings.length,
      "servings,",
      mergedExercises.length,
      "exercise days."
    );
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { writeCronometerToDb, getCronometerFromDb };
