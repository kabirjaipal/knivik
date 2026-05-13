import { PrismaClient } from '@prisma/client';
import logger from './logger.js';
import config from './config.js';

const createPrismaClient = () => {
  return new PrismaClient({
    log: [
      ...(config.PRISMA_LOG_QUERIES ? [{ emit: 'event' as const, level: 'query' as const }] : []),
      { emit: 'stdout' as const, level: 'error' as const },
      { emit: 'stdout' as const, level: 'info' as const },
      { emit: 'stdout' as const, level: 'warn' as const },
    ],
  });
};

class Database {
  private static instance: Database;
  public client: ReturnType<typeof createPrismaClient>;

  private constructor() {
    this.client = createPrismaClient();

    if (config.PRISMA_LOG_QUERIES) {
      this.client.$on('query', (e: any) => {
        logger.debug({ query: e.query, params: e.params, duration: e.duration }, 'Database query');
      });
    }
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.client.$connect();
      logger.info('✅ Database connected');
    } catch (error) {
      logger.error({ error }, '❌ Database connection failed');
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.$disconnect();
      logger.info('👋 Database disconnected');
    } catch (error) {
      logger.error({ error }, '❌ Database disconnection failed');
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

const db = Database.getInstance();
export { db };
export default Database;
