-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('PENDING_MODERATION', 'PUBLISHED', 'REJECTED', 'SOLD');

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "latinName" TEXT,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "images" TEXT[],
    "lightRequirements" TEXT,
    "waterRequirements" TEXT,
    "careInstructions" TEXT[],
    "status" "ListingStatus" NOT NULL DEFAULT 'PENDING_MODERATION',
    "rejectionReason" TEXT,
    "categoryId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Listing_status_categoryId_idx" ON "Listing"("status", "categoryId");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
