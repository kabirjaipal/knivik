-- CreateTable
CREATE TABLE "ir_site_feedbacks" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_site_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ir_site_feedbacks_userId_idx" ON "ir_site_feedbacks"("userId");

-- AddForeignKey
ALTER TABLE "ir_site_feedbacks" ADD CONSTRAINT "ir_site_feedbacks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
