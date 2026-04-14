/**
 * Unified Pipeline Worker module.
 *
 * This module handles the background execution of the scraping -> enrichment -> alert flow.
 * Consolidating into one worker reduces Redis polling overhead and infrastructure costs.
 */

import { Worker, Job } from 'bullmq';
import config from '../lib/config.js';
import logger from '../lib/logger.js';
import {
  pipelineQueue,
  InMemoryQueue,
  PIPELINE_QUEUE_NAME,
} from '../lib/queue.js';
import { BatchProcessingService } from '../services/batchProcessingService.js';

// ---------------------------------------------------------------------------
// Pipeline Processor: Scrape -> Enrich -> Alert (all in one job)
// ---------------------------------------------------------------------------

async function processPipelineJob(data: unknown): Promise<void> {
  const { userId, productId } = data as { userId?: string; productId?: string };
  
  if (productId) {
    logger.info(`🔎 Starting unified pipeline job for product ${productId}`);
    const result = await BatchProcessingService.processProduct(productId);
    if (result.success) {
      logger.info(`✅ Pipeline completed for product ${productId}: ${result.postsCollected} posts scanned → ${result.leadsGenerated} leads processed.`);
    } else {
      logger.error(`❌ Pipeline failed for product ${productId}: ${result.error}`);
    }
    return;
  }

  if (userId) {
    logger.info(`🔎 Starting unified pipeline job for user ${userId}`);
    const result = await BatchProcessingService.processUser(userId);
    if (result.success) {
      logger.info(`✅ Pipeline completed for user ${userId}: ${result.postsCollected} posts scanned → ${result.leadsGenerated} leads processed.`);
    } else {
      logger.error(`❌ Pipeline failed for user ${userId}: ${result.error}`);
    }
    return;
  }

  logger.warn('⚠️ Received pipeline job with no userId or productId');
}

// ---------------------------------------------------------------------------
// Worker Instance
// ---------------------------------------------------------------------------

const redisConnection = config.REDIS_URL
  ? { url: config.REDIS_URL, maxRetriesPerRequest: null as null, enableAutoPipelining: false }
  : null;

let pipelineWorker: Worker | null = null;

function attachWorkerListeners(worker: Worker): void {
  // CRITICAL: Without an 'error' listener, Redis auth failures emit an
  // unhandledRejection that kills the Node.js process.
  worker.on('error', (err) => {
    logger.error({ err, workerName: worker.name }, 'BullMQ worker connection error');
  });
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err, queueName: worker.name }, 'Job failed');
  });
  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, queueName: worker.name }, 'Job completed successfully');
  });
}

function createBullWorker(): void {
  if (!redisConnection) return;

  pipelineWorker = new Worker(
    PIPELINE_QUEUE_NAME,
    async (job: Job) => processPipelineJob(job.data),
    {
      connection: redisConnection,
      concurrency: config.SCRAPER_CONCURRENCY,
      lockDuration: 600_000, // 10 minutes — batch processing can be slow
    },
  );

  attachWorkerListeners(pipelineWorker);
}

function registerInMemoryHandler(): void {
  if (pipelineQueue instanceof InMemoryQueue) {
    pipelineQueue.process(processPipelineJob);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const startWorkers = (): void => {
  if (pipelineQueue instanceof InMemoryQueue) {
    registerInMemoryHandler();
    logger.info('⚙️ In-memory pipeline handler registered (Redis unavailable).');
  } else {
    createBullWorker();
    logger.info('⚙️ BullMQ Unified Pipeline Worker started.');
  }
};

export const stopWorkers = async (): Promise<void> => {
  if (pipelineWorker) {
    await pipelineWorker.close();
  }
};
