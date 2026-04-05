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

  // Product 1: LogScale Analytics (Privacy-focused analytics)
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

  // Product 2: RFP Generator Pro (Government contracting)
  await prisma.product.create({
    data: {
      name: 'RFP Generator Pro',
      description: 'AI-powered tool that creates professional Request for Proposal templates and responses for government contracts and enterprise projects.',
      userId: admin.id,
      isActive: true,
      keywords: {
        create: [
          { keyword: 'rfp template' },
          { keyword: 'proposal software' },
          { keyword: 'government contract bidding' },
          { keyword: 'how to write an rfp response' },
          { keyword: 'bid proposal template' },
          { keyword: 'tender document software' },
          { keyword: 'contract proposal generator' },
          { keyword: 'enterprise rfp tool' },
        ]
      },
      negativeKeywords: {
        create: [
          { keyword: 'dating' },
          { keyword: 'relationship' },
          { keyword: 'personal' },
          { keyword: 'hiring' },
          { keyword: 'job posting' },
          { keyword: 'tutorial' },
        ]
      },
      sources: {
        create: [
          { platform: 'REDDIT', identifier: 'government' },
          { platform: 'REDDIT', identifier: 'procurement' },
          { platform: 'REDDIT', identifier: 'startups' },
          { platform: 'REDDIT', identifier: 'contracting' },
          { platform: 'REDDIT', identifier: 'b2b' },
          { platform: 'HACKERNEWS', identifier: 'global' },
        ]
      },
      competitors: {
        create: [
          { name: 'ProposalPad' },
          { name: 'GovWin' },
          { name: 'BidMagic' },
          { name: 'Deltek' },
          { name: 'RFPMaster' },
        ]
      }
    }
  });

  // Product 3: DevOps Pipeline Builder (Developer tools)
  await prisma.product.create({
    data: {
      name: 'DevOps Pipeline Builder',
      description: 'Visual CI/CD pipeline designer for developers to create, test, and deploy automated workflows without complex YAML configuration.',
      userId: admin.id,
      isActive: true,
      keywords: {
        create: [
          { keyword: 'ci cd pipeline tool' },
          { keyword: 'github actions alternative' },
          { keyword: 'visual pipeline builder' },
          { keyword: 'automated deployment tool' },
          { keyword: 'jenkins alternative' },
          { keyword: 'devops automation platform' },
          { keyword: 'continuous integration software' },
          { keyword: 'no code ci cd' },
        ]
      },
      negativeKeywords: {
        create: [
          { keyword: 'gaming' },
          { keyword: 'entertainment' },
          { keyword: 'music' },
          { keyword: 'sports' },
          { keyword: 'fashion' },
          { keyword: 'food' },
        ]
      },
      sources: {
        create: [
          { platform: 'REDDIT', identifier: 'devops' },
          { platform: 'REDDIT', identifier: 'sysadmin' },
          { platform: 'REDDIT', identifier: 'programming' },
          { platform: 'REDDIT', identifier: 'webdev' },
          { platform: 'REDDIT', identifier: 'softwareengineering' },
          { platform: 'HACKERNEWS', identifier: 'global' },
        ]
      },
      competitors: {
        create: [
          { name: 'Jenkins' },
          { name: 'GitLab CI' },
          { name: 'CircleCI' },
          { name: 'Travis CI' },
          { name: 'GitHub Actions' },
        ]
      }
    }
  });

  // Product 4: AI Customer Support Chatbot (SaaS tool)
  await prisma.product.create({
    data: {
      name: 'AI Customer Support Chatbot',
      description: 'Intelligent chatbot platform that learns from your business documentation to provide 24/7 customer support and reduce support tickets.',
      userId: admin.id,
      isActive: true,
      keywords: {
        create: [
          { keyword: 'customer support chatbot' },
          { keyword: 'ai helpdesk software' },
          { keyword: 'automated customer service' },
          { keyword: 'chatbot for small business' },
          { keyword: 'reduce support tickets' },
          { keyword: '24 7 customer support ai' },
          { keyword: 'zendesk alternative' },
          { keyword: 'intercom alternative' },
        ]
      },
      negativeKeywords: {
        create: [
          { keyword: 'adult content' },
          { keyword: 'dating' },
          { keyword: 'gambling' },
          { keyword: 'crypto trading' },
          { keyword: 'get rich quick' },
        ]
      },
      sources: {
        create: [
          { platform: 'REDDIT', identifier: 'saas' },
          { platform: 'REDDIT', identifier: 'startups' },
          { platform: 'REDDIT', identifier: 'smallbusiness' },
          { platform: 'REDDIT', identifier: 'ecommerce' },
          { platform: 'REDDIT', identifier: 'customerexperience' },
          { platform: 'HACKERNEWS', identifier: 'global' },
        ]
      },
      competitors: {
        create: [
          { name: 'Zendesk' },
          { name: 'Intercom' },
          { name: 'Drift' },
          { name: 'Freshdesk' },
          { name: 'ChatGPT for Business' },
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
  console.log('📦 Products created: 4 diverse test products');
  console.log('🔍 Keywords per product: 8 high-intent keywords');
  console.log('🚫 Negative keywords per product: 5-6 filters');
  console.log('🌐 Sources per product: 6 targeted subreddits + HN');
  console.log('⚔️  Competitors per product: 5 major competitors');

  console.log('\n📦 Test Products Created:');
  console.log('1. LogScale Analytics - Privacy-first web analytics');
  console.log('2. RFP Generator Pro - Government contracting tool');
  console.log('3. DevOps Pipeline Builder - CI/CD automation platform');
  console.log('4. AI Customer Support Chatbot - 24/7 support solution');

  console.log('\n🔑 Demo Login Credentials:');
  console.log('Admin User (has 4 products):');
  console.log('  Email: kabir@knivik.com');
  console.log('  Password: admin123');
  console.log('Regular Users (Password for all is password123):');
  console.log('  Email: priya@knivik.com');
  console.log('  Email: rahul@knivik.com');
  console.log('  Email: ananya@knivik.com');

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
