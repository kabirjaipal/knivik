import { db } from '../src/lib/db.js';
import bcrypt from 'bcryptjs';

// Get the pre-configured PrismaClient instance which has the adapter injected
const prisma = db.client;

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing users
  // Cascading deletes will handle related records if any existed
  await prisma.user.deleteMany({});

  // Hash passwords for demo users
  const hashedPassword = await bcrypt.hash('password123', 12);
  const hashedAdminPassword = await bcrypt.hash('admin123', 12);

  console.log('👥 Creating demo users...');

  // Admin user
  await prisma.user.create({
    data: {
      email: 'admin@intentradar.com',
      username: 'admin',
      password: hashedAdminPassword,
      role: 'admin',
      plan: 'PRO',
      emailVerified: new Date(),
    },
  });

  // Regular user 1
  await prisma.user.create({
    data: {
      email: 'john@intentradar.com',
      username: 'john_doe',
      password: hashedPassword,
      role: 'user',
      plan: 'FREE',
      emailVerified: new Date(),
    },
  });

  // Regular user 2
  await prisma.user.create({
    data: {
      email: 'jane@intentradar.com',
      username: 'jane_smith',
      password: hashedPassword,
      role: 'user',
      plan: 'STARTER',
      emailVerified: new Date(),
    },
  });

  // Regular user 3
  await prisma.user.create({
    data: {
      email: 'bob@intentradar.com',
      username: 'bob_wilson',
      password: hashedPassword,
      role: 'user',
      plan: 'FREE',
      emailVerified: new Date(),
    },
  });

  console.log('✅ Created 4 demo users');

  // Display summary
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('👥 Users created: 4 (1 admin, 3 regular users)');

  console.log('\n🔑 Demo Login Credentials:');
  console.log('Admin User:');
  console.log('  Email: admin@intentradar.com');
  console.log('  Password: admin123');
  console.log('Regular Users (Password for all is password123):');
  console.log('  Email: john@intentradar.com');
  console.log('  Email: jane@intentradar.com');
  console.log('  Email: bob@intentradar.com');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
