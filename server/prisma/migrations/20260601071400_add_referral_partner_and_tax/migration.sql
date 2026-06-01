-- CreateTable
CREATE TABLE "ir_referral_partners" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_referral_partners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ir_referral_partners_userId_key" ON "ir_referral_partners"("userId");

-- AddForeignKey
ALTER TABLE "ir_referral_partners" ADD CONSTRAINT "ir_referral_partners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "ir_payments" ADD COLUMN "tax" INTEGER NOT NULL DEFAULT 0;
