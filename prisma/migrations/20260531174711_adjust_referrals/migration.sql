/*
  Warnings:

  - You are about to drop the column `paymentId` on the `ir_referral_payouts` table. All the data in the column will be lost.
  - You are about to drop the column `referralId` on the `ir_referral_payouts` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ir_referral_payouts` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `ir_referral_payouts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ir_referral_payouts" DROP CONSTRAINT "ir_referral_payouts_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "ir_referral_payouts" DROP CONSTRAINT "ir_referral_payouts_referralId_fkey";

-- DropIndex
DROP INDEX "ir_referral_payouts_paymentId_key";

-- DropIndex
DROP INDEX "ir_referral_payouts_referralId_idx";

-- AlterTable
ALTER TABLE "ir_referral_payouts" DROP COLUMN "paymentId",
DROP COLUMN "referralId",
DROP COLUMN "updatedAt",
ADD COLUMN     "creatorId" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PAID';

-- AlterTable
ALTER TABLE "ir_users" ADD COLUMN     "allowReferrals" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ir_referral_payouts_creatorId_idx" ON "ir_referral_payouts"("creatorId");

-- AddForeignKey
ALTER TABLE "ir_referral_payouts" ADD CONSTRAINT "ir_referral_payouts_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
