-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "requiresPhytosanitaryCertificate" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "certificateUrl" TEXT;
