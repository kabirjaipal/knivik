/*
  Warnings:

  - The values [STARTER] on the enum `UserPlan` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `sessionToken` on the `ir_sessions` table. All the data in the column will be lost.
  - The `emailVerified` column on the `ir_users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[token]` on the table `ir_sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `ir_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ir_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserPlan_new" AS ENUM ('FREE', 'PRO');
ALTER TABLE "public"."ir_users" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "ir_users" ALTER COLUMN "plan" TYPE "UserPlan_new" USING ("plan"::text::"UserPlan_new");
ALTER TABLE "ir_subscriptions" ALTER COLUMN "plan" TYPE "UserPlan_new" USING ("plan"::text::"UserPlan_new");
ALTER TYPE "UserPlan" RENAME TO "UserPlan_old";
ALTER TYPE "UserPlan_new" RENAME TO "UserPlan";
DROP TYPE "public"."UserPlan_old";
ALTER TABLE "ir_users" ALTER COLUMN "plan" SET DEFAULT 'FREE';
COMMIT;

-- DropIndex
DROP INDEX "ir_sessions_sessionToken_key";

-- AlterTable
ALTER TABLE "ir_sessions" DROP COLUMN "sessionToken",
ADD COLUMN     "token" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ir_users" ADD COLUMN     "image" TEXT,
ADD COLUMN     "name" TEXT,
DROP COLUMN "emailVerified",
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ir_accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ir_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ir_accounts_userId_idx" ON "ir_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_accounts_providerId_accountId_key" ON "ir_accounts"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_verifications_identifier_value_key" ON "ir_verifications"("identifier", "value");

-- CreateIndex
CREATE UNIQUE INDEX "ir_sessions_token_key" ON "ir_sessions"("token");

-- CreateIndex
CREATE INDEX "ir_sessions_expiresAt_idx" ON "ir_sessions"("expiresAt");

-- AddForeignKey
ALTER TABLE "ir_accounts" ADD CONSTRAINT "ir_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
