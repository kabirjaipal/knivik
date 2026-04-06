import { db } from '../src/lib/db.js';
import bcrypt from 'bcryptjs';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { SearchQueryService } from '../src/services/searchQueryService.js';

// Get the pre-configured PrismaClient instance which has the adapter injected
const prisma = db.client;

// Redis connection for clearing queues
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// BullMQ queue names
const SCRAPER_QUEUE_NAME = 'scraper-jobs';
const ALERT_QUEUE_NAME = 'alert-jobs';
const ENRICHMENT_QUEUE_NAME = 'enrichment-jobs';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear ALL existing tables
  // We use a transaction to ensure we clear everything before seeding
  console.log('🧹 Cleaning database...');
  await prisma.$transaction([
    prisma.alertLog.deleteMany({}),
    prisma.alertSetting.deleteMany({}),
    prisma.reply.deleteMany({}),
    prisma.leadMatch.deleteMany({}),
    prisma.lead.deleteMany({}),
    prisma.keyword.deleteMany({}),
    prisma.negativeKeyword.deleteMany({}),
    prisma.competitor.deleteMany({}),
    prisma.productSource.deleteMany({}),
    prisma.product.deleteMany({}),
    prisma.llmUsageLog.deleteMany({}),
    prisma.usageRecord.deleteMany({}),
    prisma.otpCode.deleteMany({}),
    prisma.session.deleteMany({}),
    prisma.oAuthAccount.deleteMany({}),
    prisma.user.deleteMany({}),
    prisma.scrapeCache.deleteMany({}),
    prisma.requestLog.deleteMany({}),
    prisma.llmModel.deleteMany({}),
  ]);

  // 2. Clear BullMQ queues in Redis
  console.log('🧹 Clearing BullMQ queues...');
  try {
    await redis.del('bull:' + SCRAPER_QUEUE_NAME + ':id');
    await redis.del('bull:' + SCRAPER_QUEUE_NAME + ':wait');
    await redis.del('bull:' + SCRAPER_QUEUE_NAME + ':active');
    await redis.del('bull:' + SCRAPER_QUEUE_NAME + ':completed');
    await redis.del('bull:' + SCRAPER_QUEUE_NAME + ':failed');
    await redis.del('bull:' + SCRAPER_QUEUE_NAME + ':delayed');
    await redis.del('bull:' + SCRAPER_QUEUE_NAME + ':events');

    await redis.del('bull:' + ALERT_QUEUE_NAME + ':id');
    await redis.del('bull:' + ALERT_QUEUE_NAME + ':wait');
    await redis.del('bull:' + ALERT_QUEUE_NAME + ':active');
    await redis.del('bull:' + ALERT_QUEUE_NAME + ':completed');
    await redis.del('bull:' + ALERT_QUEUE_NAME + ':failed');
    await redis.del('bull:' + ALERT_QUEUE_NAME + ':delayed');

    await redis.del('bull:' + ENRICHMENT_QUEUE_NAME + ':id');
    await redis.del('bull:' + ENRICHMENT_QUEUE_NAME + ':wait');
    await redis.del('bull:' + ENRICHMENT_QUEUE_NAME + ':active');
    await redis.del('bull:' + ENRICHMENT_QUEUE_NAME + ':completed');
    await redis.del('bull:' + ENRICHMENT_QUEUE_NAME + ':failed');
    await redis.del('bull:' + ENRICHMENT_QUEUE_NAME + ':delayed');

    console.log('✅ All BullMQ queues cleared');
  } catch (err) {
    console.warn('⚠️ Could not clear BullMQ queues:', err);
  }

  // Hash passwords for demo users
  const hashedPassword = await bcrypt.hash('password123', 12);
  const hashedAdminPassword = await bcrypt.hash('admin123', 12);

  console.log('👥 Creating demo users...');

  // Admin user
  // Admin user - Set to FREE by default to test upgrade flow
  const admin = await prisma.user.create({
    data: {
      email: 'kabir@knivik.com',
      username: 'kabir',
      password: hashedAdminPassword,
      role: 'admin',
      plan: 'FREE',
      emailVerified: new Date(),
      isScanning: false,
      lastScanStatus: null,
    },
  });
  // SDR user
  const sdr = await prisma.user.create({
    data: {
      email: 'nakul@knivik.com',
      username: 'nakul',
      password: hashedAdminPassword,
      role: 'user',
      plan: 'FREE',
      emailVerified: new Date(),
    },
  });

  // Growth user
  const growth = await prisma.user.create({
    data: {
      email: 'nikhil@knivik.com',
      username: 'nikhil_hacker',
      password: hashedAdminPassword,
      role: 'user',
      plan: 'FREE',
      emailVerified: new Date(),
    },
  });

  console.log('📦 Creating test product...');

  // Single best product for testing: AI Customer Support Chatbot
  const product = await prisma.product.create({
    data: {
      name: 'AI Customer Support Chatbot',
      description:
        'Intelligent chatbot platform that learns from your business documentation to provide 24/7 customer support and reduce support tickets. Perfect alternative to expensive helpdesk software.',
      userId: admin.id,
      isActive: true,
      keywords: {
        create: [
          { keyword: 'zendesk alternative' },
          { keyword: 'intercom alternative' },
          { keyword: 'looking for helpdesk software' },
          { keyword: 'customer support tool recommendation' },
          { keyword: 'best chatbot for customer service' },
          { keyword: 'reduce support tickets' },
          { keyword: 'automated customer support' },
          { keyword: 'tired of zendesk' },
        ],
      },
      negativeKeywords: {
        create: [
          { keyword: 'hiring' },
          { keyword: 'career' },
          { keyword: 'internship' },
          { keyword: 'tutorial' },
          { keyword: 'resume' },
          { keyword: 'course' },
          { keyword: 'Show HN' },
          { keyword: 'Look what I built' },
          { keyword: 'I made this' },
        ],
      },
      sources: {
        create: [
          { platform: 'REDDIT', identifier: 'saas' },
          { platform: 'REDDIT', identifier: 'startups' },
          { platform: 'REDDIT', identifier: 'webdev' },
          { platform: 'REDDIT', identifier: 'smallbusiness' },
          { platform: 'REDDIT', identifier: 'ecommerce' },
          { platform: 'HACKERNEWS', identifier: 'global' },
        ],
      },
      competitors: {
        create: [
          { name: 'Zendesk' },
          { name: 'Intercom' },
          { name: 'Drift' },
          { name: 'Freshdesk' },
          { name: 'Crisp' },
        ],
      },
    },
  });

  // Generate search queries for the product
  console.log('🔍 Generating search queries...');
  const queries = await SearchQueryService.generateAndSaveQueries(product.id);
  console.log(`✅ Generated ${queries.length} search queries`);

  console.log('🤖 Seeding LLM models and pricing...');

  const models = [
    {
      id: 'llama-3.1-8b-instant',
      inputPrice: 0.05,
      outputPrice: 0.08,
      modelOptions: { source: 'groq', speed: 'fast' },
    },
    {
      id: 'llama-3.3-70b-specdec',
      inputPrice: 0.59,
      outputPrice: 0.79,
      modelOptions: { source: 'groq', speed: 'balanced' },
    },
    {
      id: 'llama-3.3-70b-versatile',
      inputPrice: 0.59,
      outputPrice: 0.79,
      modelOptions: { source: 'groq', speed: 'best', reasoning_tokens_supported: true },
    },
    {
      id: 'deepseek-r1-distill-llama-70b',
      inputPrice: 0.69,
      outputPrice: 0.99,
      modelOptions: {
        source: 'groq',
        speed: 'reasoning',
        reasoning_tokens_supported: true,
        logic: 'deepseek',
      },
    },
  ];

  for (const model of models) {
    await prisma.llmModel.upsert({
      where: { id: model.id },
      update: {
        inputPrice: model.inputPrice,
        outputPrice: model.outputPrice,
        modelOptions: model.modelOptions as any,
      },
      create: {
        id: model.id,
        inputPrice: model.inputPrice,
        outputPrice: model.outputPrice,
        modelOptions: model.modelOptions as any,
      },
    });
  }

  console.log('✅ LLM models seeded');

  // Display summary
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('👥 Users created: 1 (admin only)');
  console.log('📦 Products created: 1 (AI Customer Support Chatbot)');
  console.log('🔍 Keywords: 8 high-intent keywords');
  console.log('🚫 Negative keywords: 9 filters');
  console.log('🌐 Sources: 6 targeted subreddits + HN');
  console.log('⚔️ Competitors: 5 major competitors');

  console.log('\n Demo Login Credentials (All Passwords: admin123):');
  console.log('1. Admin: kabir@knivik.com');
  console.log('2. SDR:   sdr@knivik.com');
  console.log('3. Growth: growth@knivik.com');
  console.log('--------------------------------------------');

  console.log('\n🚀 Ready to test awesome engines with IP protection!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await redis.disconnect();
  });
