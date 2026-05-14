/*
  Warnings:

  - You are about to drop the `ir_competitors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ir_keywords` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ir_lead_matches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ir_negative_keywords` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ir_product_sources` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ir_competitors" DROP CONSTRAINT "ir_competitors_productId_fkey";

-- DropForeignKey
ALTER TABLE "ir_keywords" DROP CONSTRAINT "ir_keywords_productId_fkey";

-- DropForeignKey
ALTER TABLE "ir_lead_matches" DROP CONSTRAINT "ir_lead_matches_keywordId_fkey";

-- DropForeignKey
ALTER TABLE "ir_lead_matches" DROP CONSTRAINT "ir_lead_matches_leadId_fkey";

-- DropForeignKey
ALTER TABLE "ir_negative_keywords" DROP CONSTRAINT "ir_negative_keywords_productId_fkey";

-- DropForeignKey
ALTER TABLE "ir_product_sources" DROP CONSTRAINT "ir_product_sources_productId_fkey";

-- DropTable
DROP TABLE "ir_competitors";

-- DropTable
DROP TABLE "ir_keywords";

-- DropTable
DROP TABLE "ir_lead_matches";

-- DropTable
DROP TABLE "ir_negative_keywords";

-- DropTable
DROP TABLE "ir_product_sources";
