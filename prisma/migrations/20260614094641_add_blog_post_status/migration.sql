-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "ir_blog_posts" ADD COLUMN     "status" "PostStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "ir_blog_posts_status_idx" ON "ir_blog_posts"("status");
