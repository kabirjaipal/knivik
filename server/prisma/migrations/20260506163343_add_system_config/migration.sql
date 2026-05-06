-- CreateTable
CREATE TABLE "ir_system_config" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ir_system_config_key_key" ON "ir_system_config"("key");
