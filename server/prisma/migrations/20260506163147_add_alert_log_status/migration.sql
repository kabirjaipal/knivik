-- AlterTable
ALTER TABLE "ir_alert_logs" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'sent';
