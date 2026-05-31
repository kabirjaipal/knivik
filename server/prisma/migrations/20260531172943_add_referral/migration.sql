-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('SIGNED_UP', 'CONVERTED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "ir_referral_codes" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_referrals" (
    "id" TEXT NOT NULL,
    "referralCodeId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'SIGNED_UP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_referral_payouts" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_referral_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ir_referral_codes_code_key" ON "ir_referral_codes"("code");

-- CreateIndex
CREATE INDEX "ir_referral_codes_creatorId_idx" ON "ir_referral_codes"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_referrals_referredUserId_key" ON "ir_referrals"("referredUserId");

-- CreateIndex
CREATE INDEX "ir_referrals_referralCodeId_idx" ON "ir_referrals"("referralCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_referral_payouts_paymentId_key" ON "ir_referral_payouts"("paymentId");

-- CreateIndex
CREATE INDEX "ir_referral_payouts_referralId_idx" ON "ir_referral_payouts"("referralId");

-- AddForeignKey
ALTER TABLE "ir_referral_codes" ADD CONSTRAINT "ir_referral_codes_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_referrals" ADD CONSTRAINT "ir_referrals_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ir_referral_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_referrals" ADD CONSTRAINT "ir_referrals_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_referral_payouts" ADD CONSTRAINT "ir_referral_payouts_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "ir_referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_referral_payouts" ADD CONSTRAINT "ir_referral_payouts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "ir_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
