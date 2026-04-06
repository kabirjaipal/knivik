import { db } from '../src/lib/db.js';
import bcrypt from 'bcryptjs';

// Get the pre-configured PrismaClient instance which has the adapter injected
const prisma = db.client;

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

  // Hash passwords for demo users
  const hashedPassword = await bcrypt.hash('password123', 12);
  const hashedAdminPassword = await bcrypt.hash('admin123', 12);

  console.log('👥 Creating demo users...');

  // Admin user
  const admin = await prisma.user.create({
    data: {
      email: 'kabir@knivik.com',
      username: 'kabir',
      password: hashedAdminPassword,
      role: 'admin',
      plan: 'PRO',
      emailVerified: new Date(),
      isScanning: false,
      lastScanStatus: null
    },
  });

  console.log('📦 Creating test product...');

  // Single best product for testing: LogScale Analytics (Privacy-focused analytics)
  await prisma.product.create({
    data: {
      name: 'LogScale Analytics',
      description: 'A privacy-first, cookie-less web analytics tool for developers and SaaS founders who want to move away from Google Analytics and GDPR headaches.',
      userId: admin.id,
      isActive: true,
      keywords: {
        create: [
          { keyword: 'google analytics alternative' },
          { keyword: 'cookie-less analytics' },
          { keyword: 'privacy-first tracking' },
          { keyword: 'how to stop using google analytics' },
          { keyword: 'lightweight analytics for nextjs' },
          { keyword: 'gdpr compliant analytics' },
          { keyword: 'web analytics without cookies' },
          { keyword: 'simple analytics for saas' },
        ]
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
        ]
      },
      sources: {
        create: [
          { platform: 'REDDIT', identifier: 'saas' },
          { platform: 'REDDIT', identifier: 'startups' },
          { platform: 'REDDIT', identifier: 'webdev' },
          { platform: 'REDDIT', identifier: 'programming' },
          { platform: 'REDDIT', identifier: 'privacy' },
          { platform: 'HACKERNEWS', identifier: 'global' },
        ]
      },
      competitors: {
        create: [
          { name: 'Google Analytics' },
          { name: 'Plausible' },
          { name: 'Fathom' },
          { name: 'Mixpanel' },
          { name: 'Amplitude' },
        ]
      }
    }
  });

  console.log('🤖 Seeding LLM models and pricing...');

  const models = [
    {
      id: 'llama-3.1-8b-instant',
      inputPrice: 0.05,
      outputPrice: 0.08,
      modelOptions: { source: 'groq', speed: 'fast' }
    },
    {
      id: 'llama-3.3-70b-specdec',
      inputPrice: 0.59,
      outputPrice: 0.79,
      modelOptions: { source: 'groq', speed: 'balanced' }
    },
    {
      id: 'llama-3.3-70b-versatile',
      inputPrice: 0.59,
      outputPrice: 0.79,
      modelOptions: { source: 'groq', speed: 'best', reasoning_tokens_supported: true }
    },
    {
      id: 'deepseek-r1-distill-llama-70b',
      inputPrice: 0.69,
      outputPrice: 0.99,
      modelOptions: { source: 'groq', speed: 'reasoning', reasoning_tokens_supported: true, logic: 'deepseek' }
    }
  ];

  for (const model of models) {
    await prisma.llmModel.upsert({
      where: { id: model.id },
      update: {
        inputPrice: model.inputPrice,
        outputPrice: model.outputPrice,
        modelOptions: model.modelOptions as any
      },
      create: {
        id: model.id,
        inputPrice: model.inputPrice,
        outputPrice: model.outputPrice,
        modelOptions: model.modelOptions as any
      }
    });
  }

  console.log('✅ LLM models seeded');

  // Display summary
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('👥 Users created: 1 (admin only)');
  console.log('📦 Products created: 1 (LogScale Analytics - privacy-first web analytics)');
  console.log('🔍 Keywords: 8 high-intent keywords');
  console.log('🚫 Negative keywords: 9 filters');
  console.log('🌐 Sources: 6 targeted subreddits + HN');
  console.log('⚔️ Competitors: 5 major competitors');

  console.log('\n Demo Login Credentials:');
  console.log('Admin User:');
  console.log('  Email: kabir@knivik.com');
  console.log('  Password: admin123');

  console.log('\n🚀 Ready to test awesome engines with IP protection!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
