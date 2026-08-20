import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, PoolConfig } from 'pg';
import logger from './logger';

type GlobalForPrisma = typeof globalThis & {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const globalForPrisma = globalThis as GlobalForPrisma;

const getPool = (): Pool => {
  if (globalForPrisma.pgPool) {
    return globalForPrisma.pgPool;
  }

  const rawUrl = process.env.DATABASE_URL ?? '';
  const isRemote = Boolean(
    rawUrl &&
      !rawUrl.includes('localhost') &&
      !rawUrl.includes('127.0.0.1')
  );

  // Strip query-level sslmode parameter so pg library handles SSL cleanly via config object
  const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, '');

  const poolConfig: PoolConfig = {
    connectionString,
    // Aiven Cloud PostgreSQL requires SSL encryption
    ssl: isRemote ? { rejectUnauthorized: false } : false,
    // 2 connections per serverless container instance on remote, 5 on local dev
    max: isRemote ? 2 : 5,
    // Release idle connections after 10s to keep Aiven pool capacity available
    idleTimeoutMillis: 10000,
    // 10s connection timeout for cold starts and cloud TLS handshakes
    connectionTimeoutMillis: 10000,
    // Allow Node event loop to exit gracefully during serverless pause/suspension
    allowExitOnIdle: true,
    // 20s query timeout guardrail
    statement_timeout: 20000,
  };

  const pool = new Pool(poolConfig);

  // Handle idle client errors so unexpected network disconnects or Aiven failovers do not crash the Node.js process
  pool.on('error', (err) => {
    logger.error('Unexpected error on idle database client', { error: err.message });
  });

  globalForPrisma.pgPool = pool;
  return pool;
};

const prismaClientSingleton = (): PrismaClient => {
  const pool = getPool();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Cache on globalThis for warm serverless execution
globalForPrisma.prisma = prisma;

export const db = {
  client: prisma,
};

export default db;


