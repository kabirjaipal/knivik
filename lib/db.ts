import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({
    connectionString,
    ssl: connectionString && !connectionString.includes('localhost') ? { rejectUnauthorized: false } : false,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export const db = {
  client: prisma,
  connect: async () => {
    try {
      await prisma.$connect();
    } catch (error) {
      console.error('Database connection error:', error);
    }
  },
  disconnect: async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('Database disconnection error:', error);
    }
  },
  healthCheck: async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  },
};

export default db;
