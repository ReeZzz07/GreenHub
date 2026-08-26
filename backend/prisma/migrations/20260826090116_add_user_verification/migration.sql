-- CreateEnum
CREATE TYPE "UserVerificationStatus" AS ENUM ('VERIFIED', 'PENDING_MODERATION');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "pendingEmail" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verificationStatus" "UserVerificationStatus" NOT NULL DEFAULT 'VERIFIED';
