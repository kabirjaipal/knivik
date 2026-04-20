import logger from './logger.js';

export const PIPELINE_QUEUE_NAME = 'pipeline-jobs';

class InMemoryQueue {
  private queue: any[] = [];
  private handlers: ((data: any) => Promise<void>)[] = [];
  private processing = false;
  private jobs = new Map<string, any>(); // Track jobs by ID

  process(handler: any) { this.handlers.push(handler); }

  async add(name: string, data: any, options?: any) {
    // Use provided jobId or generate one
    const jobId = options?.jobId || `mem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    // Prevent duplicate jobs with same ID
    if (this.jobs.has(jobId)) {
      logger.debug(`[QUEUE] Job ${jobId} already exists, skipping duplicate`);
      return { id: jobId, alreadyExists: true };
    }
    
    const job = { 
      id: jobId, 
      name, 
      data, 
      addedAt: Date.now(),
      finishedOn: null as number | null
    };
    
    this.jobs.set(jobId, job);
    this.queue.push(job);
    setImmediate(() => this.drain());
    return { id: jobId };
  }

  private async drain() {
    if (this.processing) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;
      for (const handler of this.handlers) {
        try { 
          await handler(job.data);
          job.finishedOn = Date.now(); // Mark as finished
        } 
        catch (err) { 
          logger.error({ err, jobId: job.id }, 'Job failed'); 
          job.finishedOn = Date.now(); // Still mark as finished even on error
        }
      }
    }
    this.processing = false;
  }

  on() { return this; }
  
  async getJob(jobId: string) { 
    return this.jobs.get(jobId) || undefined; 
  }
  
  async clean() {
    // Clean up old completed jobs (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, job] of this.jobs.entries()) {
      if (job.finishedOn && job.finishedOn < oneHourAgo) {
        this.jobs.delete(id);
      }
    }
  }
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
