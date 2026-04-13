/**
 * Worker module.
 *
 * When Redis is available: BullMQ Workers are created and poll the Redis-backed queues.
 * When Redis is unavailable: The InMemoryQueue calls job handlers directly as jobs are
 * added via `queue.add()`, so no separate Worker instances are needed.
 */

import { Worker, Job } from 'bullmq';
import { Platform } from '@prisma/client';
import config from '../lib/config.js';
import logger from '../lib/logger.js';
import {
  scraperQueue,
  alertQueue,
  enrichmentQueue,
  InMemoryQueue,
  SCRAPER_QUEUE_NAME,
  ALERT_QUEUE_NAME,
  ENRICHMENT_QUEUE_NAME,
} from '../lib/queue.js';
import { BatchProcessingService } from '../services/batchProcessingService.js';
import { sendLeadAlert } from '../services/alertService.js';
import { enrichLead } from '../services/enrichmentService.js';

// ---------------------------------------------------------------------------
// Job processors (shared between BullMQ workers and in-memory queue handlers)
// ---------------------------------------------------------------------------

async function processScrapeJob(data: unknown): Promise<void> {
  const { userId } = data as { userId: string };
  logger.info(`🔎 Starting batch scraper job for user ${userId}`);
  const result = await BatchProcessingService.processUser(userId);
  if (result.success) {
    logger.info(
      `✅ Batch processing completed for user ${userId}: ${result.postsCollected} posts → ${result.leadsGenerated} leads in ${result.processingTime}ms`,
    );
  } else {
    logger.error(`❌ Batch processing failed for user ${userId}: ${result.error}`);
  }
}

async function processAlertJob(data: unknown): Promise<void> {
  const { leadId } = data as { leadId: string };
  logger.info(`🔔 Processing alert for lead ${leadId}`);
  await sendLeadAlert(leadId);
}

async function processEnrichmentJob(data: unknown): Promise<void> {
  const { leadId, username, platform } = data as { leadId: string; username: string; platform: Platform };
  logger.info(`✨ Enriching lead ${leadId} for user ${username}`);
  await enrichLead(leadId, username, platform);
}

// ---------------------------------------------------------------------------
// BullMQ Worker instances (only created when Redis is available)
// ---------------------------------------------------------------------------

const redisConnection = config.REDIS_URL
  ? { url: config.REDIS_URL, maxRetriesPerRequest: null as null, enableAutoPipelining: false }
  : null;

let scraperWorker: Worker | null = null;
let alertWorker: Worker | null = null;
let enrichmentWorker: Worker | null = null;

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

function createBullWorkers(): void {
  if (!redisConnection) return;

  scraperWorker = new Worker(
    SCRAPER_QUEUE_NAME,
    async (job: Job) => processScrapeJob(job.data),
    {
      connection: redisConnection,
      concurrency: config.SCRAPER_CONCURRENCY,
      lockDuration: 600_000, // 10 minutes — batch processing can be slow
    },
  );

  alertWorker = new Worker(
    ALERT_QUEUE_NAME,
    async (job: Job) => processAlertJob(job.data),
    {
      connection: redisConnection,
      concurrency: 10,
    },
  );

  enrichmentWorker = new Worker(
    ENRICHMENT_QUEUE_NAME,
    async (job: Job) => processEnrichmentJob(job.data),
    {
      connection: redisConnection,
      concurrency: 2,
    },
  );

  [scraperWorker, alertWorker, enrichmentWorker].forEach(attachWorkerListeners);
}

function registerInMemoryHandlers(): void {
  if (scraperQueue instanceof InMemoryQueue) {
    scraperQueue.process(processScrapeJob);
  }
  if (alertQueue instanceof InMemoryQueue) {
    alertQueue.process(processAlertJob);
  }
  if (enrichmentQueue instanceof InMemoryQueue) {
    enrichmentQueue.process(processEnrichmentJob);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const startWorkers = (): void => {
  if (scraperQueue instanceof InMemoryQueue) {
    // In-memory mode: register handlers directly on the queue objects.
    registerInMemoryHandlers();
    logger.info('⚙️ In-memory job processors registered (Redis unavailable).');
  } else {
    // Redis mode: spin up BullMQ Worker instances.
    createBullWorkers();
    logger.info('⚙️ BullMQ Workers started and listening for jobs.');
  }
};

export const stopWorkers = async (): Promise<void> => {
  await Promise.all(
    [scraperWorker, alertWorker, enrichmentWorker]
      .filter((w): w is Worker => w !== null)
      .map(w => w.close()),
  );
};
