/*
  Warnings:

  - The values [RESEARCHING,LOW_INTENT] on the enum `IntentLevel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "IntentLevel_new" AS ENUM ('BUY_NOW', 'COMPARING');
ALTER TABLE "ir_leads" ALTER COLUMN "intentLevel" TYPE "IntentLevel_new" USING ("intentLevel"::text::"IntentLevel_new");
ALTER TYPE "IntentLevel" RENAME TO "IntentLevel_old";
ALTER TYPE "IntentLevel_new" RENAME TO "IntentLevel";
DROP TYPE "public"."IntentLevel_old";
COMMIT;
