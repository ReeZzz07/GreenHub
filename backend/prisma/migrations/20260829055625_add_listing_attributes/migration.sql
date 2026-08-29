-- CreateEnum
CREATE TYPE "PlantType" AS ENUM ('CONIFEROUS', 'DECIDUOUS');

-- CreateEnum
CREATE TYPE "LifeCycle" AS ENUM ('PERENNIAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "LightNeed" AS ENUM ('SUN_LOVING', 'SHADE_TOLERANT');

-- CreateEnum
CREATE TYPE "RootSystemType" AS ENUM ('CLOSED', 'OPEN');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "ageMonths" INTEGER,
ADD COLUMN     "diameterCm" INTEGER,
ADD COLUMN     "heightCm" INTEGER,
ADD COLUMN     "lifeCycle" "LifeCycle",
ADD COLUMN     "lightNeed" "LightNeed",
ADD COLUMN     "plantType" "PlantType",
ADD COLUMN     "potVolumeL" INTEGER,
ADD COLUMN     "rootSystemType" "RootSystemType",
ADD COLUMN     "toxicToPets" BOOLEAN;
