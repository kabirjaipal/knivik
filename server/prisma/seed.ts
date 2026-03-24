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

  console.log('📦 Creating high-quality test products...');

  // Product: FastVideo AI
  await prisma.product.create({
    data: {
      name: 'FastVideo AI',
      description: 'An AI video editor for busy SaaS founders to create high-quality demo videos and LinkedIn ads in minutes.',
      userId: admin.id,
      isActive: true,
      keywords: {
        create: [
          { keyword: 'best video editor for founders' },
          { keyword: 'how to make a saas demo video' },
          { keyword: 'alternative to capcut for business' },
          { keyword: 'descript alternative' },
          { keyword: 'tool for making linkedin video ads' },
        ]
      },
      negativeKeywords: {
        create: [
          { keyword: 'gaming' },
          { keyword: 'movie' },
          { keyword: 'cinema' },
          { keyword: 'hiring' },
          { keyword: 'career' },
          { keyword: 'internship' },
          { keyword: 'Show HN' },
          { keyword: 'Look what I built' },
          { keyword: 'I made this' },
          { keyword: 'How I hit' },
          { keyword: 'MRR' },
          { keyword: 'course' },
          { keyword: 'tutorial' },
          { keyword: 'resume' },
        ]
      },
      sources: {
        create: [
          { platform: 'REDDIT', identifier: 'saas' },
          { platform: 'REDDIT', identifier: 'videomarketing' },
          { platform: 'REDDIT', identifier: 'startups' },
          { platform: 'HACKERNEWS', identifier: 'global' },
        ]
      },
      competitors: {
        create: [
          { name: 'CapCut' },
          { name: 'Descript' },
          { name: 'InVideo' },
        ]
      }
    }
  });

  // Regular user 1
  await prisma.user.create({
    data: {
      email: 'priya@knivik.com',
      username: 'priya_sharma',
      password: hashedPassword,
      role: 'user',
      plan: 'FREE',
      emailVerified: new Date(),
      isScanning: false,
      lastScanStatus: null
    },
  });

  // Regular user 2
  await prisma.user.create({
    data: {
      email: 'rahul@knivik.com',
      username: 'rahul_gupta',
      password: hashedPassword,
      role: 'user',
      plan: 'STARTER',
      emailVerified: new Date(),
      isScanning: false,
      lastScanStatus: null
    },
  });

  // Regular user 3
  await prisma.user.create({
    data: {
      email: 'ananya@knivik.com',
      username: 'ananya_verma',
      password: hashedPassword,
      role: 'user',
      plan: 'FREE',
      emailVerified: new Date(),
      isScanning: false,
      lastScanStatus: null
    },
  });

  console.log('✅ Created 4 demo users');

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
  console.log('👥 Users created: 4 (1 admin, 3 regular users)');

  console.log('\n🔑 Demo Login Credentials:');
  console.log('Admin User:');
  console.log('  Email: kabir@knivik.com');
  console.log('  Password: admin123');
  console.log('Regular Users (Password for all is password123):');
  console.log('  Email: priya@knivik.com');
  console.log('  Email: rahul@knivik.com');
  console.log('  Email: ananya@knivik.com');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
