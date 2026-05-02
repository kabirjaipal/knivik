/*
  Warnings:

  - You are about to drop the column `paddlePaymentId` on the `ir_payments` table. All the data in the column will be lost.
  - You are about to drop the column `paddleCustomerId` on the `ir_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `paddleSubscriptionId` on the `ir_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `paddleCustomerId` on the `ir_users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[lemonSqueezyPaymentId]` on the table `ir_payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lemonSqueezySubscriptionId]` on the table `ir_subscriptions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lemonSqueezyCustomerId]` on the table `ir_users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lemonSqueezyPaymentId` to the `ir_payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lemonSqueezyCustomerId` to the `ir_subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lemonSqueezySubscriptionId` to the `ir_subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ir_payments_paddlePaymentId_key";

-- DropIndex
DROP INDEX "ir_subscriptions_paddleSubscriptionId_key";

-- DropIndex
DROP INDEX "ir_users_paddleCustomerId_key";

-- AlterTable
ALTER TABLE "ir_payments" DROP COLUMN "paddlePaymentId",
ADD COLUMN     "lemonSqueezyPaymentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ir_subscriptions" DROP COLUMN "paddleCustomerId",
DROP COLUMN "paddleSubscriptionId",
ADD COLUMN     "lemonSqueezyCustomerId" TEXT NOT NULL,
ADD COLUMN     "lemonSqueezySubscriptionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ir_users" DROP COLUMN "paddleCustomerId",
ADD COLUMN     "lemonSqueezyCustomerId" TEXT;

-- CreateTable
CREATE TABLE "ir_webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ir_webhook_events_eventId_key" ON "ir_webhook_events"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_payments_lemonSqueezyPaymentId_key" ON "ir_payments"("lemonSqueezyPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_subscriptions_lemonSqueezySubscriptionId_key" ON "ir_subscriptions"("lemonSqueezySubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_users_lemonSqueezyCustomerId_key" ON "ir_users"("lemonSqueezyCustomerId");
