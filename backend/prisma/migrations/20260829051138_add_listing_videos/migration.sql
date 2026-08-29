-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "videos" TEXT[] DEFAULT ARRAY[]::TEXT[];
