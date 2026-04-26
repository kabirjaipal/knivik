import { db } from '../src/lib/db.js';
import bcrypt from 'bcryptjs';

// Get the pre-configured PrismaClient instance
const prisma = db.client;

async function main() {
  // --- PRODUCTION SAFETY GUARD ---
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_SEED !== 'true') {
    console.error('❌ ERROR: Seeding is blocked in production to prevent data loss.');
    console.error('If you REALLY want to seed and WIPE your production data, set FORCE_SEED=true');
    process.exit(1);
  }
  // -------------------------------

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
    prisma.account.deleteMany({}),
    prisma.verification.deleteMany({}),
    prisma.oAuthAccount.deleteMany({}),
    prisma.user.deleteMany({}),
    prisma.scrapeCache.deleteMany({}),
    prisma.requestLog.deleteMany({}),
    prisma.llmModel.deleteMany({}),
  ]);

  // Hash passwords using bcryptjs (matches server/src/lib/auth.ts)
  const hashedPassword = await bcrypt.hash('admin123', 12);

  console.log('👥 Creating demo users...');

  // Admin user with Better Auth Account
  const admin = await prisma.user.create({
    data: {
      email: 'kabir@knivik.com',
      name: 'kabir',
      username: 'kabir',
      password: hashedPassword,
      role: 'admin',
      plan: 'FREE',
      emailVerified: true,
      isScanning: false,
      lastScanStatus: null,
      accounts: {
        create: {
          providerId: 'credential',
          accountId: 'kabir@knivik.com',
          password: hashedPassword,
        }
      }
    },
  });

  // SDR user with Better Auth Account
  await prisma.user.create({
    data: {
      email: 'nakul@knivik.com',
      name: 'nakul',
      username: 'nakul',
      password: hashedPassword,
      role: 'user',
      plan: 'FREE',
      emailVerified: true,
      accounts: {
        create: {
          providerId: 'credential',
          accountId: 'nakul@knivik.com',
          password: hashedPassword,
        }
      }
    },
  });

  // Growth user with Better Auth Account
  await prisma.user.create({
    data: {
      email: 'nikhil@knivik.com',
      name: 'nikhil_hacker',
      username: 'nikhil_hacker',
      password: hashedPassword,
      role: 'user',
      plan: 'FREE',
      emailVerified: true,
      accounts: {
        create: {
          providerId: 'credential',
          accountId: 'nikhil@knivik.com',
          password: hashedPassword,
        }
      }
    },
  });

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
  console.log('👥 Users created: 3 (1 admin, 2 users)');
  console.log('📦 Products: Clean start (0 products)');
  console.log('🤖 LLM Models: 4 models registered');

  console.log('\n Demo Login Credentials (All Passwords: admin123):');
  console.log('1. Admin: kabir@knivik.com');
  console.log('2. User: nakul@knivik.com');
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
  });
