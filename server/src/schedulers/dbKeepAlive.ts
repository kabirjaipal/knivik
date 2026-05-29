import { db } from '../lib/db.js';
import config from '../lib/config.js';
import logger from '../lib/logger.js';

let intervalId: NodeJS.Timeout | null = null;

export const start = (): void => {
  if (config.NODE_ENV !== 'production') {
    return;
  }

  if (intervalId) {
    logger.warn('Database keep-alive ping scheduler is already running');
    return;
  }

  const KEEP_ALIVE_INTERVAL_MS = 4 * 60 * 1000; 
  intervalId = setInterval(async () => {
    try {
      await db.client.$queryRaw`SELECT 1`;
      logger.debug('Database keep-alive ping successful');
    } catch (error) {
      logger.error({ error }, 'Database keep-alive ping failed');
    }
  }, KEEP_ALIVE_INTERVAL_MS);
  
  logger.info('🛰️ Database keep-alive ping scheduled every 4 minutes');
};

export const stop = (): void => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('🛰️ Database keep-alive ping scheduler stopped');
  }
};
