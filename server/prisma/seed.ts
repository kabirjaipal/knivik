import { db } from '../src/lib/db.js';
import { hashPassword } from 'better-auth/crypto';

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
    prisma.lead.deleteMany({}),
    prisma.product.deleteMany({}),
    prisma.llmUsageLog.deleteMany({}),
    prisma.usageRecord.deleteMany({}),
    prisma.otpCode.deleteMany({}),
    prisma.session.deleteMany({}),
    prisma.account.deleteMany({}),
    prisma.verification.deleteMany({}),
    prisma.oAuthAccount.deleteMany({}),
    prisma.payment.deleteMany({}),
    prisma.subscription.deleteMany({}),
    prisma.webhookEvent.deleteMany({}),
    prisma.siteFeedback.deleteMany({}),
    prisma.user.deleteMany({}),
    prisma.scrapeCache.deleteMany({}),
    prisma.requestLog.deleteMany({}),
    prisma.llmModel.deleteMany({}),
    prisma.systemConfig.deleteMany({}),
  ]);

  // Hash passwords using Better Auth standard scrypt algorithm
  const hashedPassword = await hashPassword('KniOw2032!');

  console.log('👥 Creating owner user...');

  // Owner user with Better Auth Account
  const owner = await prisma.user.create({
    data: {
      email: 'owner@knivik.xyz',
      displayUsername: 'owner',
      username: 'owner',
      password: hashedPassword,
      role: 'admin',
      plan: 'PRO',
      emailVerified: true,
      isScanning: false,
      lastScanStatus: null,
      accounts: {
        create: {
          providerId: 'credential',
          accountId: 'owner@knivik.xyz',
          password: hashedPassword,
        },
      },
    },
  });

  console.log('🤖 Seeding LLM models and pricing...');

  await prisma.llmModel.createMany({
    data: [
      {
        id: 'llama-3.1-8b-instant',
        inputPrice: 0.05,
        outputPrice: 0.08,
        modelOptions: { source: 'groq', speed: 'fast' },
      },
      {
        id: 'llama-3.3-70b-versatile',
        inputPrice: 0.59,
        outputPrice: 0.79,
        modelOptions: { source: 'groq', speed: 'best', reasoning_tokens_supported: true },
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ LLM models seeded');

  // Display summary
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('👥 Users created: 1 (1 owner)');
  console.log('📦 Products: Clean start (0 products)');
  console.log('🤖 LLM Models: 2 models registered');

  console.log('\n Login Credentials (Password: KniOw2032!):');
  console.log('1. Owner: owner@knivik.xyz');
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
