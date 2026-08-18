import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

type GlobalForPrisma = typeof globalThis & {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const globalForPrisma = globalThis as GlobalForPrisma;

const getPool = () => {
  if (globalForPrisma.pgPool) {
    return globalForPrisma.pgPool;
  }

  const rawUrl = process.env.DATABASE_URL ?? '';
  const isRemote = Boolean(rawUrl && !rawUrl.includes('localhost'));
  const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, '');

  const pool = new Pool({
    connectionString,
    ssl: isRemote ? { rejectUnauthorized: false } : false,
    max: isRemote ? 3 : 5,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: true,
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pgPool = pool;
  }
  return pool;
};

const prismaClientSingleton = () => {
  const pool = getPool();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const db = {
  client: prisma,
};

export default db;


