import logger from '../lib/logger.js';
import { pipelineQueue } from '../lib/queue.js';
import { BatchProcessingService } from '../services/batchProcessingService.js';

async function processPipelineJob(data: any): Promise<void> {
  const { userId, productId } = data;
  
  if (productId) {
    logger.info(`🔎 [IN-MEMORY] Starting pipeline for product ${productId}`);
    const result = await BatchProcessingService.processProduct(productId);
    if (result.success) {
      logger.info(`✅ [IN-MEMORY] Completed for product ${productId}: ${result.postsCollected} posts scanned.`);
    } else {
      logger.error(`❌ [IN-MEMORY] Failed for product ${productId}: ${result.error}`);
    }
    return;
  }

  if (userId) {
    logger.info(`🔎 [IN-MEMORY] Starting pipeline for user ${userId}`);
    const result = await BatchProcessingService.processUser(userId);
    if (result.success) {
      logger.info(`✅ [IN-MEMORY] Completed for user ${userId}: ${result.postsCollected} posts scanned.`);
    } else {
      logger.error(`❌ [IN-MEMORY] Failed for user ${userId}: ${result.error}`);
    }
    return;
  }
}

export const startWorkers = (): void => {
  pipelineQueue.process(processPipelineJob);
  logger.info('⚙️  In-memory pipeline workers started.');
};

export const stopWorkers = async (): Promise<void> => {
  // No-op for in-memory
};
