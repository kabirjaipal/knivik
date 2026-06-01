import { db } from '../lib/db.js';
import config from '../lib/config.js';
import logger from '../lib/logger.js';
import { pipelineQueue } from '../lib/queue.js';

let timeoutId: NodeJS.Timeout | null = null;
let isStopping = false;

const waitForJobToComplete = async (jobId: string): Promise<void> => {
  const maxWaitTime = 10 * 60 * 1000; // 10 minutes max wait per product
  const checkInterval = 2000; // Check every 2 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime && !isStopping) {
    const job = await pipelineQueue.getJob(jobId);

    if (!job || job.finishedOn) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  if (!isStopping) {
    logger.warn(`Timeout waiting for job ${jobId} to complete`);
  }
};

const runScraperDispatcher = async () => {
  if (isStopping) return;
  try {
    logger.info(`🛰 Dispatching scraper jobs to the queue...`);
    const activeProducts = await db.client.product.findMany({
      where: { isActive: true },
      select: { 
        id: true, 
        userId: true, 
        config: true,
        user: {
          select: { plan: true }
        }
      },
    });

    // Filter: PRO products are scanned every cycle. FREE products are scanned once every 24 hours.
    const productsToScan = activeProducts.filter((product) => {
      if (product.user?.plan === 'PRO') {
        return true;
      }
      // Free tier scanning logic: 1 scan every 24 hours
      const productConfig = (product.config as Record<string, any>) || {};
      const lastBgScan = productConfig['lastBackgroundScanAt'];
      if (!lastBgScan) {
        return true; // Scan if it has never been scanned
      }
      const lastScanTime = new Date(lastBgScan).getTime();
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return lastScanTime < oneDayAgo;
    });

    // Group products by user
    const productsByUser = new Map<string, string[]>();
    for (const product of productsToScan) {
      if (!productsByUser.has(product.userId)) {
        productsByUser.set(product.userId, []);
      }
      productsByUser.get(product.userId)!.push(product.id);
    }

    logger.info(
      `📊 Found ${productsToScan.length} products to scan across ${productsByUser.size} active users`
    );

    // Process each user's products sequentially, but users in parallel
    const userPromises = Array.from(productsByUser.entries()).map(
      async ([userId, productIds]) => {
        if (isStopping) return;
        logger.info(`👤 [User: ${userId}] Starting scan for ${productIds.length} products`);

        for (let i = 0; i < productIds.length; i++) {
          if (isStopping) return;
          const productId = productIds[i];
          const jobId = `scrape-product-${productId}`;

          logger.info(
            `👤 [User: ${userId}] Queuing product ${i + 1}/${productIds.length}: ${productId}`
          );

          const added = await pipelineQueue.add(
            'scrape-product',
            { userId, productId },
            {
              jobId,
              removeOnComplete: true,
            }
          );

          if (added.alreadyExists) {
            logger.info(
              `👤 [User: ${userId}] Product ${productId} already running, waiting for completion...`
            );
          }

          // Wait for this product to complete before starting next one
          await waitForJobToComplete(jobId);
          logger.info(
            `👤 [User: ${userId}] ✅ Product ${i + 1}/${productIds.length} finished processing`
          );
        }

        logger.info(
          `👤 [User: ${userId}] ✅ All ${productIds.length} products completed for this interval`
        );
      }
    );

    // Wait for all users to complete their sequential product runs
    await Promise.all(userPromises);
    logger.info(`✅ All users completed their product scans for this interval`);
  } catch (err) {
    logger.error({ err }, 'Error in scraper dispatcher');
  }
};

const scheduleNextScraperRun = async () => {
  if (isStopping) return;
  if (config.SCRAPER_INTERVAL_MS > 0) {
    logger.info(`⏳ Waiting ${config.SCRAPER_INTERVAL_MS / 60000} minutes before next scan...`);
    timeoutId = setTimeout(async () => {
      await runScraperDispatcher();
      await scheduleNextScraperRun(); // Schedule the next one after this completes
    }, config.SCRAPER_INTERVAL_MS);
  }
};

export const start = (): void => {
  isStopping = false;
  if (config.SCRAPER_INTERVAL_MS > 0) {
    logger.info(`⏳ Initial scan starting in ${config.SCRAPER_INTERVAL_MS / 60000} minutes`);
    timeoutId = setTimeout(async () => {
      await runScraperDispatcher();
      await scheduleNextScraperRun();
    }, config.SCRAPER_INTERVAL_MS);
  } else {
    logger.info('⏸️ Scraper dispatcher disabled (SCRAPER_INTERVAL_MS set to 0)');
  }
};

export const stop = (): void => {
  isStopping = true;
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  logger.info('🛰️ Scraper dispatcher scheduler stopped');
};
