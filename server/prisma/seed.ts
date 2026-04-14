import { db } from '../src/lib/db.js';
import bcrypt from 'bcryptjs';
import RedisClient from 'ioredis';
import { SearchQueryService } from '../src/services/searchQueryService.js';
import { PIPELINE_QUEUE_NAME } from '../src/lib/queue.js';

// Get the pre-configured PrismaClient instance
const prisma = db.client;

const redisUrl = process.env.REDIS_URL;

// Explicitly type the redis variable to fix the "implicitly has type any" error
let redis: RedisClient | null = null;

if (redisUrl) {
  try {
    redis = new RedisClient(redisUrl, {
      maxRetriesPerRequest: 0, // Fail fast during seeding if Redis is unreachable
      connectTimeout: 5000,
    });
    // Prevent the seed process from crashing if Redis connection fails
    redis.on('error', (err) => {
      // Only log if it's not a connection refused (which we expect if Redis is down)
      if (!err.message.includes('ECONNREFUSED')) {
        console.warn('📡 Redis connection error:', err.message);
      }
    });
  } catch (err) {
    console.warn('⚠️ Redis initialization failed, skipping queue cleanup.');
  }
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear ALL existing tables
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

  // 2. Clear BullMQ queues in Redis (Optional - only if Redis is available)
  if (redis) {
    console.log('🧹 Clearing BullMQ queues...');
    try {
      // Find and delete all keys related to our unified pipeline
      const keys = await redis.keys(`bull:${PIPELINE_QUEUE_NAME}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`✅ Cleared ${keys.length} background job keys`);
      } else {
        console.log('✅ No background jobs to clear');
      }
    } catch (err: any) {
      console.warn('⚠️ Could not clear BullMQ queues (Redis unreachable):', err.message);
    }
  } else {
    console.log('⏭️ Skipping Redis cleanup (Redis disabled)');
  }

  // Hash passwords for demo users
  const hashedAdminPassword = await bcrypt.hash('admin123', 12);

  console.log('👥 Creating demo users...');

  // Admin user
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
  await prisma.user.create({
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
  await prisma.user.create({
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
    if (redis) {
      await redis.quit(); // Use quit() instead of disconnect() for cleaner exit
    }
  });
