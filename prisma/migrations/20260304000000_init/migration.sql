-- CreateTable
CREATE TABLE "CronometerDaily" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "energyKcal" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "fiberG" DOUBLE PRECISION NOT NULL,
    "sodiumMg" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronometerDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CronometerServing" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "time" TEXT,
    "group" TEXT,
    "foodName" TEXT NOT NULL,
    "amount" TEXT,
    "energyKcal" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronometerServing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CronometerMeta" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronometerMeta_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "CronometerDaily_date_key" ON "CronometerDaily"("date");
