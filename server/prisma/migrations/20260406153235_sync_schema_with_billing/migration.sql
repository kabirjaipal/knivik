/*
  Warnings:

  - The values [LINKEDIN,DISCORD,PRODUCTHUNT] on the enum `Platform` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[paddleCustomerId]` on the table `ir_users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Platform_new" AS ENUM ('REDDIT', 'HACKERNEWS', 'TWITTER');
ALTER TABLE "ir_product_sources" ALTER COLUMN "platform" TYPE "Platform_new" USING ("platform"::text::"Platform_new");
ALTER TABLE "ir_leads" ALTER COLUMN "platform" TYPE "Platform_new" USING ("platform"::text::"Platform_new");
ALTER TABLE "ir_scrape_cache" ALTER COLUMN "platform" TYPE "Platform_new" USING ("platform"::text::"Platform_new");
ALTER TYPE "Platform" RENAME TO "Platform_old";
ALTER TYPE "Platform_new" RENAME TO "Platform";
DROP TYPE "public"."Platform_old";
COMMIT;

-- AlterTable
ALTER TABLE "ir_leads" ADD COLUMN     "detectedBy" TEXT NOT NULL DEFAULT 'KEYWORD',
ADD COLUMN     "enrichment" JSONB,
ADD COLUMN     "reasoning" TEXT;

-- AlterTable
ALTER TABLE "ir_products" ADD COLUMN     "searchQueries" JSONB;

-- AlterTable
ALTER TABLE "ir_users" ADD COLUMN     "billingCycle" TEXT,
ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "isScanning" BOOLEAN DEFAULT false,
ADD COLUMN     "lastScanStatus" TEXT,
ADD COLUMN     "paddleCustomerId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT;

-- CreateTable
CREATE TABLE "ir_llm_models" (
    "id" TEXT NOT NULL,
    "inputPrice" DOUBLE PRECISION NOT NULL,
    "outputPrice" DOUBLE PRECISION NOT NULL,
    "cachedPrice" DOUBLE PRECISION,
    "modelOptions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_llm_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_llm_usage_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "productId" TEXT,
    "action" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_llm_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paddleSubscriptionId" TEXT NOT NULL,
    "paddleCustomerId" TEXT NOT NULL,
    "plan" "UserPlan" NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paddlePaymentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ir_llm_usage_logs_userId_createdAt_idx" ON "ir_llm_usage_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ir_llm_usage_logs_action_createdAt_idx" ON "ir_llm_usage_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "ir_llm_usage_logs_modelId_idx" ON "ir_llm_usage_logs"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_subscriptions_paddleSubscriptionId_key" ON "ir_subscriptions"("paddleSubscriptionId");

-- CreateIndex
CREATE INDEX "ir_subscriptions_userId_idx" ON "ir_subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_payments_paddlePaymentId_key" ON "ir_payments"("paddlePaymentId");

-- CreateIndex
CREATE INDEX "ir_payments_userId_idx" ON "ir_payments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_users_paddleCustomerId_key" ON "ir_users"("paddleCustomerId");

-- AddForeignKey
ALTER TABLE "ir_llm_usage_logs" ADD CONSTRAINT "ir_llm_usage_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_llm_usage_logs" ADD CONSTRAINT "ir_llm_usage_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ir_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_llm_usage_logs" ADD CONSTRAINT "ir_llm_usage_logs_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ir_llm_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_subscriptions" ADD CONSTRAINT "ir_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_payments" ADD CONSTRAINT "ir_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
