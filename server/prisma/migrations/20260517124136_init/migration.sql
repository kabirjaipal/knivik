-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('REDDIT', 'HACKERNEWS', 'TWITTER');

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
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "image" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "plan" "UserPlan" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "lastScanStatus" TEXT,
    "isScanning" BOOLEAN DEFAULT false,
    "dodoCustomerId" TEXT,
    "subscriptionStatus" TEXT,
    "billingCycle" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),

    CONSTRAINT "ir_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "searchQueries" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_products_pkey" PRIMARY KEY ("id")
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
    "detectedBy" TEXT NOT NULL DEFAULT 'KEYWORD',
    "reasoning" TEXT,
    "enrichment" JSONB,

    CONSTRAINT "ir_leads_pkey" PRIMARY KEY ("id")
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
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailTarget" TEXT,
    "slackEnabled" BOOLEAN NOT NULL DEFAULT false,
    "slackWebhook" TEXT,
    "webhookType" TEXT NOT NULL DEFAULT 'SLACK',
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
    "status" TEXT NOT NULL DEFAULT 'sent',
    "errorMessage" TEXT,
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

-- CreateTable
CREATE TABLE "ir_llm_models" (
    "id" TEXT NOT NULL,
    "inputPrice" DOUBLE PRECISION NOT NULL,
    "outputPrice" DOUBLE PRECISION NOT NULL,
    "cachedPrice" DOUBLE PRECISION,
    "modelOptions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_llm_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_llm_usage_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "productId" TEXT,
    "action" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_llm_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dodoSubscriptionId" TEXT,
    "dodoCustomerId" TEXT,
    "plan" "UserPlan" NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dodoPaymentId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ir_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_system_config" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_system_config_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "ir_users_email_key" ON "ir_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ir_users_username_key" ON "ir_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ir_users_dodoCustomerId_key" ON "ir_users"("dodoCustomerId");

-- CreateIndex
CREATE INDEX "ir_users_plan_idx" ON "ir_users"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "ir_sessions_token_key" ON "ir_sessions"("token");

-- CreateIndex
CREATE INDEX "ir_sessions_userId_idx" ON "ir_sessions"("userId");

-- CreateIndex
CREATE INDEX "ir_sessions_expiresAt_idx" ON "ir_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "ir_otp_codes_email_type_idx" ON "ir_otp_codes"("email", "type");

-- CreateIndex
CREATE INDEX "ir_otp_codes_expiresAt_idx" ON "ir_otp_codes"("expiresAt");

-- CreateIndex
CREATE INDEX "ir_accounts_userId_idx" ON "ir_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_accounts_providerId_accountId_key" ON "ir_accounts"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_verifications_identifier_value_key" ON "ir_verifications"("identifier", "value");

-- CreateIndex
CREATE INDEX "ir_oauth_accounts_userId_idx" ON "ir_oauth_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_oauth_accounts_provider_providerAccountId_key" ON "ir_oauth_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "ir_products_userId_idx" ON "ir_products"("userId");

-- CreateIndex
CREATE INDEX "ir_products_userId_isActive_idx" ON "ir_products"("userId", "isActive");

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

-- CreateIndex
CREATE INDEX "ir_llm_usage_logs_userId_createdAt_idx" ON "ir_llm_usage_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ir_llm_usage_logs_action_createdAt_idx" ON "ir_llm_usage_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "ir_llm_usage_logs_modelId_idx" ON "ir_llm_usage_logs"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_subscriptions_dodoSubscriptionId_key" ON "ir_subscriptions"("dodoSubscriptionId");

-- CreateIndex
CREATE INDEX "ir_subscriptions_userId_idx" ON "ir_subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_payments_dodoPaymentId_key" ON "ir_payments"("dodoPaymentId");

-- CreateIndex
CREATE INDEX "ir_payments_userId_idx" ON "ir_payments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_webhook_events_eventId_key" ON "ir_webhook_events"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ir_system_config_key_key" ON "ir_system_config"("key");

-- CreateIndex
CREATE INDEX "ir_site_feedbacks_userId_idx" ON "ir_site_feedbacks"("userId");

-- AddForeignKey
ALTER TABLE "ir_sessions" ADD CONSTRAINT "ir_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_otp_codes" ADD CONSTRAINT "ir_otp_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_accounts" ADD CONSTRAINT "ir_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_oauth_accounts" ADD CONSTRAINT "ir_oauth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_products" ADD CONSTRAINT "ir_products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_leads" ADD CONSTRAINT "ir_leads_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ir_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "ir_llm_usage_logs" ADD CONSTRAINT "ir_llm_usage_logs_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ir_llm_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_llm_usage_logs" ADD CONSTRAINT "ir_llm_usage_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ir_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_llm_usage_logs" ADD CONSTRAINT "ir_llm_usage_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_subscriptions" ADD CONSTRAINT "ir_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_payments" ADD CONSTRAINT "ir_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_site_feedbacks" ADD CONSTRAINT "ir_site_feedbacks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ir_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
