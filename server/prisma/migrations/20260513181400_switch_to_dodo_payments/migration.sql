-- DropIndex
DROP INDEX "ir_payments_lemonSqueezyPaymentId_key";

-- DropIndex
DROP INDEX "ir_subscriptions_lemonSqueezySubscriptionId_key";

-- DropIndex
DROP INDEX "ir_users_lemonSqueezyCustomerId_key";

-- AlterTable
ALTER TABLE "ir_payments" DROP COLUMN "lemonSqueezyPaymentId",
ADD COLUMN     "dodoPaymentId" TEXT;

-- AlterTable
ALTER TABLE "ir_subscriptions" DROP COLUMN "lemonSqueezyCustomerId",
DROP COLUMN "lemonSqueezySubscriptionId",
ADD COLUMN     "dodoCustomerId" TEXT,
ADD COLUMN     "dodoSubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "ir_users" DROP COLUMN "lemonSqueezyCustomerId",
ADD COLUMN     "dodoCustomerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ir_payments_dodoPaymentId_key" ON "ir_payments"("dodoPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_subscriptions_dodoSubscriptionId_key" ON "ir_subscriptions"("dodoSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_users_dodoCustomerId_key" ON "ir_users"("dodoCustomerId");
