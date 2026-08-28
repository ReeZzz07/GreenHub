-- CreateTable
CREATE TABLE "HomePageContent" (
    "id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "HomePageContent_pkey" PRIMARY KEY ("id")
);
