-- AlterTable
ALTER TABLE "ir_sessions" ADD COLUMN IF NOT EXISTS "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "ir_users" ADD COLUMN IF NOT EXISTS "banned" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "banReason" TEXT,
ADD COLUMN IF NOT EXISTS "banExpires" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ir_scrape_cache" ADD COLUMN IF NOT EXISTS "productId" TEXT NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "ir_scrape_cache_platform_externalPostId_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ir_scrape_cache_productId_platform_externalPostId_key" ON "ir_scrape_cache"("productId", "platform", "externalPostId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ir_scrape_cache_productId_idx" ON "ir_scrape_cache"("productId");

-- AddForeignKey
ALTER TABLE "ir_scrape_cache" DROP CONSTRAINT IF EXISTS "ir_scrape_cache_productId_fkey";
ALTER TABLE "ir_scrape_cache" ADD CONSTRAINT "ir_scrape_cache_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ir_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
