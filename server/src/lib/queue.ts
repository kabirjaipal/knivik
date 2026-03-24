import { Queue, ConnectionOptions } from 'bullmq';
import config from './config.js';
import logger from './logger.js';

const redisConnection: ConnectionOptions = {
  url: config.QUEUE_REDIS_URL || config.REDIS_URL || 'redis://localhost:6379',
  maxRetriesPerRequest: null, // Critical for BullMQ
};

// Queue names
export const SCRAPER_QUEUE_NAME = 'scraper-jobs';
export const ALERT_QUEUE_NAME = 'alert-jobs';
export const ENRICHMENT_QUEUE_NAME = 'enrichment-jobs';

// Initialize Queues
export const scraperQueue = new Queue(SCRAPER_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 100 }, // Keep last 100 for debugging
    removeOnFail: { count: 500 },
  },
});

export const alertQueue = new Queue(ALERT_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const enrichmentQueue = new Queue(ENRICHMENT_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 10000, // Be polite to external APIs
    },
  },
});

logger.info('🚀 BullMQ Queues initialized');
