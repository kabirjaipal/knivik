/*
  Warnings:

  - You are about to drop the column `responseTime` on the `ir_request_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `ir_request_logs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ir_request_logs" DROP COLUMN "responseTime",
DROP COLUMN "userAgent";
