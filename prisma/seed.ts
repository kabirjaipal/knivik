import { db } from '../lib/db';
import { auth } from '../lib/auth';

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
    prisma.blogPost.deleteMany({}),
  ]);

  console.log('👥 Creating owner user...');

  // Owner user with Better Auth Account using Better Auth API
  // Change these credentials before seeding your own instance.
  const ownerEmail = process.env.SEED_OWNER_EMAIL || 'admin@example.com';
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || 'ChangeMe123!';

  await auth.api.signUpEmail({
    body: {
      email: ownerEmail,
      password: ownerPassword,
      name: 'owner',
      username: 'owner',
    },
  });

  // Update roles and metadata to match seed expectations
  await prisma.user.update({
    where: { email: ownerEmail },
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
      {
        id: 'openai/gpt-oss-20b',
        inputPrice: 0.075,
        outputPrice: 0.30,
        modelOptions: { source: 'groq', speed: 'fast', reasoning_tokens_supported: true },
      },
      {
        id: 'openai/gpt-oss-120b',
        inputPrice: 0.15,
        outputPrice: 0.60,
        modelOptions: { source: 'groq', speed: 'best', reasoning_tokens_supported: true },
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ LLM models seeded');

  console.log('⚙️ Seeding system configurations...');

  await prisma.systemConfig.createMany({
    data: [
      {
        id: 'config-maintenanceMode',
        key: 'maintenanceMode',
        value: false,
      },
      {
        id: 'config-registrationEnabled',
        key: 'registrationEnabled',
        value: true,
      },
      {
        id: 'config-aiModelVersatile',
        key: 'aiModelVersatile',
        value: 'openai/gpt-oss-120b',
      },
      {
        id: 'config-aiModelLite',
        key: 'aiModelLite',
        value: 'openai/gpt-oss-20b',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ System configurations seeded');

  // Display summary
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('👥 Users created: 1 (1 owner)');
  console.log('📦 Products: Clean start (0 products)');
  console.log('🤖 LLM Models: 4 models registered');
  console.log('⚙️ System Configs: 4 settings registered');

  console.log('\n Login Credentials:');
  console.log(`1. Owner: ${ownerEmail} / ${ownerPassword}`);
  console.log('--------------------------------------------');
  console.log('⚠️  Remember to change SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD env vars before seeding.');

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
