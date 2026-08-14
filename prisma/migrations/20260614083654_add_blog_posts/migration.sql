-- CreateTable
CREATE TABLE "ir_blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readTime" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "createdById" TEXT NOT NULL,
    "faq" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ir_blog_posts_slug_key" ON "ir_blog_posts"("slug");

-- CreateIndex
CREATE INDEX "ir_blog_posts_category_idx" ON "ir_blog_posts"("category");

-- CreateIndex
CREATE INDEX "ir_blog_posts_createdAt_idx" ON "ir_blog_posts"("createdAt");

-- AddForeignKey
ALTER TABLE "ir_blog_posts" ADD CONSTRAINT "ir_blog_posts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "ir_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
