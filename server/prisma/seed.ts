import { db } from '../src/lib/db.js';
import { auth } from '../src/lib/auth.js';

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

  console.log('👥 Creating owner user...');

  // Owner user with Better Auth Account using Better Auth API
  await auth.api.signUpEmail({
    body: {
      email: 'owner@knivik.xyz',
      password: 'KniOw2032!',
      name: 'owner',
      username: 'owner',
    },
  });

  // Update roles and metadata to match seed expectations
  await prisma.user.update({
    where: { email: 'owner@knivik.xyz' },
    data: {
      role: 'admin',
      plan: 'PRO',
      emailVerified: true,
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
