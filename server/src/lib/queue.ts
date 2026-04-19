import logger from './logger.js';

export const PIPELINE_QUEUE_NAME = 'pipeline-jobs';

class InMemoryQueue {
  private queue: any[] = [];
  private handlers: ((data: any) => Promise<void>)[] = [];
  private processing = false;

  process(handler: any) { this.handlers.push(handler); }

  async add(name: string, data: any, options?: any) {
    const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.queue.push({ id, name, data });
    setImmediate(() => this.drain());
    return { id };
  }

  private async drain() {
    if (this.processing) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;
      for (const handler of this.handlers) {
        try { await handler(job.data); } 
        catch (err) { logger.error({ err, jobId: job.id }, 'Job failed'); }
      }
    }
    this.processing = false;
  }

  on() { return this; }
  async getJob() { return undefined; }
  async clean() {}
}

// In-memory version
export const pipelineQueue = new InMemoryQueue() as any;

/**
 * TO ENABLE REDIS LATER:
 * 1. npm install bullmq ioredis
 * 2. Replace the export above with:
 *    export const pipelineQueue = new BullQueue(PIPELINE_QUEUE_NAME, { connection: { url: process.env.REDIS_URL } });
 */

console.warn('⚠️  [QUEUE] Running in IN-MEMORY mode.');
