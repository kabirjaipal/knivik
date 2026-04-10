-- AlterTable
ALTER TABLE "ir_alert_settings" ADD COLUMN     "emailTarget" TEXT,
ADD COLUMN     "webhookType" TEXT NOT NULL DEFAULT 'SLACK',
ALTER COLUMN "emailEnabled" SET DEFAULT false;
