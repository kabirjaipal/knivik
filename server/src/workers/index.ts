import { Worker, Job } from 'bullmq';
import config from '../lib/config.js';
import logger from '../lib/logger.js';
import { SCRAPER_QUEUE_NAME, ALERT_QUEUE_NAME, ENRICHMENT_QUEUE_NAME } from '../lib/queue.js';
import { BatchProcessingService } from '../services/batchProcessingService.js';
import { sendLeadAlert } from '../services/alertService.js';
import { enrichLead } from '../services/enrichmentService.js';

const redisConnection = {
  url: config.QUEUE_REDIS_URL || config.REDIS_URL || 'redis://localhost:6379',
  maxRetriesPerRequest: null,
};

/**
 * 🚀 Batch Scraper Worker 🔎
 * Handles the new optimized batch processing approach.
 * Collects posts from last month, then makes 1 AI call per user.
 */
const scraperWorker = new Worker(
  SCRAPER_QUEUE_NAME,
  async (job: Job) => {
    const { userId } = job.data;
    logger.info(`🔎 Starting batch scraper job for user ${userId} (Job ID: ${job.id})`);
    try {
      const result = await BatchProcessingService.processUser(userId);
      
      if (result.success) {
        logger.info(`✅ Batch processing completed for user ${userId}: ${result.postsCollected} posts → ${result.leadsGenerated} leads in ${result.processingTime}ms`);
      } else {
        logger.error(`❌ Batch processing failed for user ${userId}: ${result.error}`);
      }
      
    } catch (err: any) {
      logger.error({ err, userId }, 'Batch scraper work failed');
      throw err; // Allow BullMQ to handle retries
    }
  },
  { 
    connection: redisConnection,
    concurrency: config.SCRAPER_CONCURRENCY,
    // Batch processing takes longer - increase lock duration
    lockDuration: 600000, // 10 minutes
  }
);

/**
 * 🔔 Alert Worker 📧
 * Handles sending emails and slack webhooks asynchronously.
 */
const alertWorker = new Worker(
  ALERT_QUEUE_NAME,
  async (job: Job) => {
    const { leadId } = job.data;
    logger.info(`🔔 Processing alert for lead ${leadId}`);
    try {
      await sendLeadAlert(leadId);
    } catch (err: any) {
      logger.error({ err, leadId }, 'Alert work failed');
      throw err;
    }
  },
  { 
    connection: redisConnection,
    concurrency: 10, // Many alerts can run in parallel
  }
);

/**
 * 🕵️ Enrichment Worker ✨
 * Handles secondary scraping of social profiles.
 */
const enrichmentWorker = new Worker(
  ENRICHMENT_QUEUE_NAME,
  async (job: Job) => {
    const { leadId, username, platform } = job.data;
    logger.info(`✨ Enriching lead ${leadId} for user ${username}`);
    try {
      await enrichLead(leadId, username, platform);
    } catch (err: any) {
      logger.error({ err, leadId }, 'Enrichment work failed');
      throw err;
    }
  },
  { 
    connection: redisConnection,
    concurrency: 2, // Slow down enrichment to avoid rate limits
  }
);

// Graceful listener error handling
[scraperWorker, alertWorker, enrichmentWorker].forEach(worker => {
  // CRITICAL: Without an 'error' listener, Redis auth failures from a quota-exceeded
  // Upstash instance emit an unhandledRejection that kills the Node.js process.
  worker.on('error', (err) => {
    logger.error({ err, workerName: worker.name }, 'BullMQ worker connection error');
  });
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err, queueName: worker.name }, 'Job failed');
  });
  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, queueName: worker.name }, 'Job completed successfully');
  });
});

export const startWorkers = () => {
    logger.info('⚙️ Distributed workers started and listening for jobs...');
};

export const stopWorkers = async () => {
  await Promise.all([
    scraperWorker.close(),
    alertWorker.close(),
    enrichmentWorker.close(),
  ]);
};
