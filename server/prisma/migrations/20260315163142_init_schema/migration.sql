-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('FREE', 'STARTER', 'PRO');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('REDDIT', 'HACKERNEWS', 'TWITTER', 'LINKEDIN', 'DISCORD', 'PRODUCTHUNT');

-- CreateEnum
CREATE TYPE "IntentLevel" AS ENUM ('BUY_NOW', 'RESEARCHING', 'COMPARING', 'LOW_INTENT');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'QUALIFIED', 'SAVED', 'CONTACTED', 'CONVERTED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AlertChannel" AS ENUM ('EMAIL', 'SLACK', 'DASHBOARD');

-- CreateEnum
CREATE TYPE "OtpType" AS ENUM ('LOGIN', 'VERIFY_EMAIL', 'RESET_PASSWORD');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('GOOGLE', 'GITHUB', 'TWITTER', 'DISCORD');

-- CreateTable
CREATE TABLE "ir_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "plan" "UserPlan" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "ir_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_otp_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "OtpType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_oauth_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_products" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "websiteUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "aiConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_product_sources" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "identifier" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_product_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_keywords" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_negative_keywords" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_negative_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_competitors" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_leads" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "externalPostId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "authorUsername" TEXT,
    "intentLevel" "IntentLevel" NOT NULL,
    "intentScore" INTEGER NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "notes" TEXT,
    "feedback" INTEGER,

    CONSTRAINT "ir_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_lead_matches" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "keywordId" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_lead_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_replies" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "generatedText" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'helpful',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_alert_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "slackEnabled" BOOLEAN NOT NULL DEFAULT false,
    "slackWebhook" TEXT,
    "minIntentScore" INTEGER NOT NULL DEFAULT 70,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_alert_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_alert_logs" (
    "id" TEXT NOT NULL,
    "alertSettingId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "channel" "AlertChannel" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_alert_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_scrape_cache" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "externalPostId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_scrape_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_request_logs" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "userId" TEXT,
    "statusCode" INTEGER,
    "responseTime" INTEGER,
    "requestBody" JSONB,
    "responseBody" JSONB,
    "headers" JSONB,
    "query" JSONB,
    "params" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_usage_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ir_users_email_key" ON "ir_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ir_users_username_key" ON "ir_users"("username");

-- CreateIndex
CREATE INDEX "ir_users_plan_idx" ON "ir_users"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "ir_sessions_sessionToken_key" ON "ir_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "ir_sessions_userId_idx" ON "ir_sessions"("userId");

-- CreateIndex
CREATE INDEX "ir_otp_codes_email_type_idx" ON "ir_otp_codes"("email", "type");

-- CreateIndex
CREATE INDEX "ir_otp_codes_expiresAt_idx" ON "ir_otp_codes"("expiresAt");

-- CreateIndex
CREATE INDEX "ir_oauth_accounts_userId_idx" ON "ir_oauth_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_oauth_accounts_provider_providerAccountId_key" ON "ir_oauth_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "ir_products_userId_idx" ON "ir_products"("userId");

-- CreateIndex
CREATE INDEX "ir_products_userId_isActive_idx" ON "ir_products"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ir_product_sources_productId_platform_identifier_key" ON "ir_product_sources"("productId", "platform", "identifier");

-- CreateIndex
CREATE INDEX "ir_keywords_productId_isActive_idx" ON "ir_keywords"("productId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ir_keywords_productId_keyword_key" ON "ir_keywords"("productId", "keyword");

-- CreateIndex
CREATE UNIQUE INDEX "ir_negative_keywords_productId_keyword_key" ON "ir_negative_keywords"("productId", "keyword");

-- CreateIndex
CREATE INDEX "ir_competitors_productId_idx" ON "ir_competitors"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_competitors_productId_name_key" ON "ir_competitors"("productId", "name");

-- CreateIndex
CREATE INDEX "ir_leads_productId_idx" ON "ir_leads"("productId");

-- CreateIndex
CREATE INDEX "ir_leads_productId_status_idx" ON "ir_leads"("productId", "status");

-- CreateIndex
CREATE INDEX "ir_leads_productId_intentLevel_idx" ON "ir_leads"("productId", "intentLevel");

-- CreateIndex
CREATE INDEX "ir_leads_productId_intentScore_idx" ON "ir_leads"("productId", "intentScore" DESC);

-- CreateIndex
CREATE INDEX "ir_leads_productId_createdAt_idx" ON "ir_leads"("productId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ir_leads_createdAt_idx" ON "ir_leads"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ir_leads_platform_externalPostId_productId_key" ON "ir_leads"("platform", "externalPostId", "productId");

-- CreateIndex
CREATE INDEX "ir_lead_matches_leadId_idx" ON "ir_lead_matches"("leadId");

-- CreateIndex
CREATE INDEX "ir_lead_matches_keywordId_idx" ON "ir_lead_matches"("keywordId");

-- CreateIndex
CREATE INDEX "ir_replies_leadId_idx" ON "ir_replies"("leadId");

-- CreateIndex
CREATE INDEX "ir_replies_userId_idx" ON "ir_replies"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_alert_settings_userId_key" ON "ir_alert_settings"("userId");

-- CreateIndex
CREATE INDEX "ir_alert_logs_alertSettingId_idx" ON "ir_alert_logs"("alertSettingId");

-- CreateIndex
CREATE INDEX "ir_alert_logs_leadId_idx" ON "ir_alert_logs"("leadId");

-- CreateIndex
CREATE INDEX "ir_alert_logs_sentAt_idx" ON "ir_alert_logs"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "ir_alert_logs_alertSettingId_leadId_channel_key" ON "ir_alert_logs"("alertSettingId", "leadId", "channel");

-- CreateIndex
CREATE INDEX "ir_scrape_cache_processedAt_idx" ON "ir_scrape_cache"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ir_scrape_cache_platform_externalPostId_key" ON "ir_scrape_cache"("platform", "externalPostId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_request_logs_requestId_key" ON "ir_request_logs"("requestId");

-- CreateIndex
CREATE INDEX "ir_request_logs_createdAt_idx" ON "ir_request_logs"("createdAt");

-- CreateIndex
CREATE INDEX "ir_request_logs_method_idx" ON "ir_request_logs"("method");

-- CreateIndex
CREATE INDEX "ir_request_logs_statusCode_idx" ON "ir_request_logs"("statusCode");

-- CreateIndex
CREATE INDEX "ir_request_logs_userId_idx" ON "ir_request_logs"("userId");

-- CreateIndex
CREATE INDEX "ir_usage_records_userId_month_year_idx" ON "ir_usage_records"("userId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ir_usage_records_userId_type_month_year_key" ON "ir_usage_records"("userId", "type", "month", "year");

-- AddForeignKey
ALTER TABLE "ir_sessions" ADD CONSTRAINT "ir_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_otp_codes" ADD CONSTRAINT "ir_otp_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_oauth_accounts" ADD CONSTRAINT "ir_oauth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_products" ADD CONSTRAINT "ir_products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_product_sources" ADD CONSTRAINT "ir_product_sources_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ir_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_keywords" ADD CONSTRAINT "ir_keywords_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ir_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_negative_keywords" ADD CONSTRAINT "ir_negative_keywords_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ir_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_competitors" ADD CONSTRAINT "ir_competitors_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ir_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_leads" ADD CONSTRAINT "ir_leads_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ir_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_lead_matches" ADD CONSTRAINT "ir_lead_matches_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "ir_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_lead_matches" ADD CONSTRAINT "ir_lead_matches_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "ir_keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_replies" ADD CONSTRAINT "ir_replies_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "ir_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_replies" ADD CONSTRAINT "ir_replies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_alert_settings" ADD CONSTRAINT "ir_alert_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_alert_logs" ADD CONSTRAINT "ir_alert_logs_alertSettingId_fkey" FOREIGN KEY ("alertSettingId") REFERENCES "ir_alert_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_alert_logs" ADD CONSTRAINT "ir_alert_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "ir_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_usage_records" ADD CONSTRAINT "ir_usage_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
