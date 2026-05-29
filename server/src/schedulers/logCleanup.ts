import { db } from '../lib/db.js';
import logger from '../lib/logger.js';

let intervalId: NodeJS.Timeout | null = null;

const runLogCleanup = async (): Promise<void> => {
  logger.info('🧹 Starting database request log cleanup...');
  try {
    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const deleteResult = await db.client.requestLog.deleteMany({
      where: {
        createdAt: {
          lt: twoMonthsAgo,
        },
      },
    });
    logger.info(`🧹 Request log cleanup finished. Deleted ${deleteResult.count} logs older than 2 months.`);
  } catch (error) {
    logger.error({ error }, 'Failed to run request log cleanup');
  }
};

export const start = (): void => {
  if (intervalId) {
    logger.warn('Log cleanup scheduler is already running');
    return;
  }

  // Run cleanup immediately on server start, then every 24 hours
  runLogCleanup();

  const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
  intervalId = setInterval(runLogCleanup, CLEANUP_INTERVAL_MS);
  logger.info('🛰️ Log cleanup scheduler registered to run every 24 hours');
};

export const stop = (): void => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('🛰️ Log cleanup scheduler stopped');
  }
};
