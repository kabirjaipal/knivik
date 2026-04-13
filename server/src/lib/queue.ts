/**
 * Queue module with automatic Redis → in-memory fallback.
 *
 * Strategy:
 *   1. If REDIS_URL is set, attempt to create BullMQ queues backed by Redis.
 *   2. If Redis is unavailable (boot-time or runtime error), log a prominent
 *      console warning and switch every queue to a lightweight in-memory
 *      implementation that uses an async event-emitter pattern.
 *   3. Callers interact only with the `IQueue` interface and never need to know
 *      which transport is active.
 */

import { Queue as BullQueue, ConnectionOptions } from 'bullmq';
import config from './config.js';
import logger from './logger.js';

// ---------------------------------------------------------------------------
// Shared queue names
// ---------------------------------------------------------------------------
export const SCRAPER_QUEUE_NAME = 'scraper-jobs';
export const ALERT_QUEUE_NAME = 'alert-jobs';
export const ENRICHMENT_QUEUE_NAME = 'enrichment-jobs';

// ---------------------------------------------------------------------------
// In-memory queue fallback
// ---------------------------------------------------------------------------

type InMemoryJobHandler = (data: unknown) => Promise<void>;

interface InMemoryJob {
  id: string;
  name: string;
  data: unknown;
  finishedOn?: number;
}

export class InMemoryQueue {
  private readonly queue: InMemoryJob[] = [];
  private handlers: InMemoryJobHandler[] = [];
  private processing = false;
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  /** Register a processor function called for each job. */
  process(handler: InMemoryJobHandler): void {
    this.handlers.push(handler);
  }

  async add(jobName: string, data: unknown, options?: { jobId?: string }): Promise<{ id: string }> {
    const jobId = options?.jobId ?? `mem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.queue.push({ id: jobId, name: jobName, data });
    setImmediate(() => this.drain());
    return { id: jobId };
  }

  async getJob(id: string): Promise<InMemoryJob | undefined> {
    return this.queue.find(job => job.id === id);
  }

  /** BullMQ-compatible no-ops so callers can use the same API. */
  async drain(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;
      for (const handler of this.handlers) {
        try {
          await handler(job.data);
        } catch (err) {
          logger.error({ err, jobId: job.id, queueName: this.name }, '[IN-MEMORY QUEUE] Job failed');
        }
      }
      job.finishedOn = Date.now();
    }
    this.processing = false;
  }

  async clean(_grace: number, _limit: number, _type: string): Promise<void> {
    // Nothing to clean in memory — jobs are discarded after processing.
  }

  // BullMQ Queue emits events; replicate the error listener API to avoid consumer errors.
  on(_event: string, _handler: (...args: unknown[]) => void): this {
    return this;
  }
}

// ---------------------------------------------------------------------------
// Union type — callers depend on this interface only
// ---------------------------------------------------------------------------
export type AnyQueue = BullQueue | InMemoryQueue;

// ---------------------------------------------------------------------------
// Factory — tries Redis first, falls back to in-memory
// ---------------------------------------------------------------------------

let redisAvailable = true;

function logRedisFallback(queueName: string, err: unknown): void {
  console.error(`\n❌ [QUEUE] Redis unavailable for "${queueName}" — falling back to in-memory queue.\n`);
  logger.error({ err, queueName }, '[QUEUE] Redis connection failed; switched to in-memory mode.');
}

function createQueue(name: string): AnyQueue {
  if (!config.REDIS_URL || !redisAvailable) {
    return new InMemoryQueue(name);
  }

  const connection: ConnectionOptions = {
    url: config.REDIS_URL,
    // Critical for BullMQ — must be null, NOT a finite number.
    maxRetriesPerRequest: null,
    enableAutoPipelining: false,
  };

  try {
    const bullQueue = new BullQueue(name, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });

    // CRITICAL: Without an 'error' listener, a failed Redis connection emits an
    // unhandledRejection that crashes the Node.js process.
    bullQueue.on('error', (err) => {
      if (redisAvailable) {
        redisAvailable = false; // Prevent flood of identical log entries.
        logRedisFallback(name, err);
      }
      logger.error({ err, queueName: name }, '[QUEUE] BullMQ queue error');
    });

    return bullQueue;
  } catch (err) {
    redisAvailable = false;
    logRedisFallback(name, err);
    return new InMemoryQueue(name);
  }
}

// ---------------------------------------------------------------------------
// Exported queue instances
// ---------------------------------------------------------------------------
export const scraperQueue = createQueue(SCRAPER_QUEUE_NAME);
export const alertQueue = createQueue(ALERT_QUEUE_NAME);
export const enrichmentQueue = createQueue(ENRICHMENT_QUEUE_NAME);

// ---------------------------------------------------------------------------
// Determine which mode is active and log once at boot
// ---------------------------------------------------------------------------
if (scraperQueue instanceof InMemoryQueue) {
  console.warn('\n⚠️  [QUEUE] Running in IN-MEMORY queue mode. Jobs will NOT survive restarts.\n');
  logger.warn('[QUEUE] All queues are running in in-memory mode (no Redis).');
} else {
  logger.info('🚀 BullMQ Queues initialised (Redis-backed).');
}
