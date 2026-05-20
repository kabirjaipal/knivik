import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { db } from './lib/db.js';
import config from './lib/config.js';
import logger from './lib/logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';

import { httpLogger, dbLogger } from './middleware/logging.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import authRoutes from './routes/auth.routes.js';
import { createServer } from 'http';
import { initSocket } from './lib/socket.js';

import { pipelineQueue } from './lib/queue.js';
import { startWorkers, stopWorkers } from './workers/index.js';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      rawBody?: string;
      user?: {
        id: string;
        email: string;
        username: string;
        role: string;
        plan: string;
        subscriptionStatus: string | null;
        billingCycle: string | null;
        currentPeriodEnd: Date | null;
        dodoCustomerId: string | null;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}

const app = express();

// Security best-practice
app.disable('x-powered-by');
app.set('trust proxy', config.TRUST_PROXY);

// Health check for Render/Cloud
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Security middleware: Hardened Helmet setup for a pure JSON API server
app.use(
  (helmet as any)({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        sandbox: ["allow-same-origin", "allow-forms"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    frameguard: {
      action: 'deny',
    },
  })
);
app.use(
  cors({
    origin: config.CORS_ORIGIN.split(',').map((origin: string) => origin.trim()),
    credentials: true,
  })
);

// Rate limiting — always memory-based.
const rateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: config.TRUST_PROXY },
  message: {
    success: false,
    error: {
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
});
app.use(rateLimiter);

// Mount Better Auth BEFORE express.json() - required by Better Auth docs
// Better Auth handles its own body parsing
app.use('/api/auth', authRoutes);

// Basic middleware (only for non-Better-Auth routes)
app.use(compression());
app.use(
  express.json({
    limit: config.REQUEST_BODY_LIMIT,
    verify: (req: any, _res, buf) => {
      (req as any).rawBody = buf.toString('utf8');
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Custom middleware
app.use(requestIdMiddleware);
app.use(httpLogger);
app.use(dbLogger);

// Routes (excluding auth which is already mounted)
app.use('/', routes);

// Error handling: catch-all 404 handler placed after routes
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const setupGracefulShutdown = (server: import('http').Server) => {
  const shutdown = async (signal: string) => {
    try {
      logger.info({ signal }, 'Shutting down');
      await new Promise<void>((resolve) => server.close(() => resolve()));
      if (config.ENABLE_QUEUE) {
        await stopWorkers();
      }
      await db.disconnect();
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  };
  ['SIGTERM', 'SIGINT'].forEach((sig) => {
    process.on(sig, () => shutdown(sig));
  });
};

// Initialize server
async function startServer() {
  try {
    await db.connect();

    // Start Neon database keep-alive ping in production (runs every 4 minutes to prevent scale-to-zero)
    if (config.NODE_ENV === 'production') {
      const KEEP_ALIVE_INTERVAL_MS = 4 * 60 * 1000; 
      setInterval(async () => {
        try {
          await db.client.$queryRaw`SELECT 1`;
          logger.debug('Database keep-alive ping successful');
        } catch (error) {
          logger.error({ error }, 'Database keep-alive ping failed');
        }
      }, KEEP_ALIVE_INTERVAL_MS);
      logger.info('🛰️ Database keep-alive ping scheduled every 4 minutes');
    }

    // Reset stale scanning states from any previous crashed/interrupted run.
    // Without this, users remain stuck in 'SCANNING' state after a server crash/restart.
    try {
      const staleCount = await db.client.user.updateMany({
        where: { isScanning: true },
        data: { isScanning: false, lastScanStatus: 'FAILED' },
      });
      if (staleCount.count > 0) {
        logger.warn({ count: staleCount.count }, 'Reset stale isScanning flags from previous run');
      }
    } catch (err) {
      logger.error({ err }, 'Failed to reset stale isScanning flags');
    }

    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(config.PORT, config.HOST, () => {
      logger.info(
        `🚀 Worker ${process.pid} listening at http://${config.HOST}:${config.PORT} (${config.NODE_ENV})`
      );
    });

    // Tune HTTP server timeouts for proxies/load balancers
    httpServer.keepAliveTimeout = 65_000;
    httpServer.headersTimeout = 67_000;

    setupGracefulShutdown(httpServer);

    // Start Distributed Workers (if enabled)
    if (config.ENABLE_QUEUE) {
      // Clear ALL jobs from previous runs to prevent immediate scanning
      try {
        // Drain waiting jobs
        await pipelineQueue.drain();
        logger.info('🧹 Stale scraper jobs drained from queue.');

        // Clean up active, completed, and failed jobs
        await pipelineQueue.clean(0, 0, 'active');
        await pipelineQueue.clean(0, 0, 'completed');
        await pipelineQueue.clean(0, 0, 'failed');
        await pipelineQueue.clean(0, 0, 'delayed');

        logger.info('🧹 All scraper job states cleaned from queue.');
      } catch (err) {
        logger.warn({ err }, 'Failed to clean pipeline queue on startup');
      }

      // Small delay before starting workers to ensure cleanup is complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      startWorkers();
      logger.info('⚙️ Distributed workers started and listening for jobs...');
    }

    // Start Scraper Dispatcher Loop (only if enabled)
    // Process products sequentially per user - each user's products run one-by-one
    const runScraperDispatcher = async () => {
      try {
        logger.info(`🛰 Dispatching scraper jobs to the queue...`);
        const activeProducts = await db.client.product.findMany({
          where: { 
            isActive: true,
            user: { plan: 'PRO' }
          },
          select: { id: true, userId: true },
        });

        // Group products by user
        const productsByUser = new Map<string, string[]>();
        for (const product of activeProducts) {
          if (!productsByUser.has(product.userId)) {
            productsByUser.set(product.userId, []);
          }
          productsByUser.get(product.userId)!.push(product.id);
        }

        logger.info(
          `📊 Found ${activeProducts.length} products across ${productsByUser.size} users`
        );

        // Process each user's products sequentially, but users in parallel
        const userPromises = Array.from(productsByUser.entries()).map(
          async ([userId, productIds]) => {
            logger.info(`👤 [User: ${userId}] Starting scan for ${productIds.length} products`);

            for (let i = 0; i < productIds.length; i++) {
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

    const waitForJobToComplete = async (jobId: string): Promise<void> => {
      const maxWaitTime = 10 * 60 * 1000; // 10 minutes max wait per product
      const checkInterval = 2000; // Check every 2 seconds
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        const job = await pipelineQueue.getJob(jobId);

        if (!job || job.finishedOn) {
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, checkInterval));
      }

      logger.warn(`Timeout waiting for job ${jobId} to complete`);
    };

    const scheduleNextScraperRun = async () => {
      if (config.SCRAPER_INTERVAL_MS > 0) {
        logger.info(`⏳ Waiting ${config.SCRAPER_INTERVAL_MS / 60000} minutes before next scan...`);
        await new Promise((resolve) => setTimeout(resolve, config.SCRAPER_INTERVAL_MS));
        await runScraperDispatcher();
        await scheduleNextScraperRun(); // Schedule the next one after this completes
      }
    };

    // Start the loop
    if (config.SCRAPER_INTERVAL_MS > 0) {
      logger.info(`⏳ Initial scan starting in ${config.SCRAPER_INTERVAL_MS / 60000} minutes`);
      setTimeout(async () => {
        await runScraperDispatcher();
        await scheduleNextScraperRun();
      }, config.SCRAPER_INTERVAL_MS);
    } else {
      logger.info('⏸️ Scraper dispatcher disabled (SCRAPER_INTERVAL_MS set to 0)');
    }

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.fatal({ error }, 'Uncaught exception occurred');
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.fatal({ reason, promise }, 'Unhandled rejection occurred');
      process.exit(1);
    });

    return httpServer;
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

if (process.env['NODE_ENV'] !== 'test') {
  // For clustering, prefer PM2 exec_mode=cluster or container orchestration
  startServer();
}

export default app;
