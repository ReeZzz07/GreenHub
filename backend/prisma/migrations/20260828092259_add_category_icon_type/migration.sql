-- CreateEnum
CREATE TYPE "CategoryIconType" AS ENUM ('EMOJI', 'PRESET', 'UPLOAD');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "iconType" "CategoryIconType" NOT NULL DEFAULT 'EMOJI';
