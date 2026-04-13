import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import type { Store as RateLimitStore } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Redis } from 'ioredis';
import { db } from './lib/db.js';
import config from './lib/config.js';
import logger from './lib/logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { httpLogger, dbLogger } from './middleware/logging.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { createServer } from 'http';
import { initSocket } from './lib/socket.js';
import { scraperQueue } from './lib/queue.js';
import { startWorkers, stopWorkers } from './workers/index.js';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        id: string;
        email: string;
        username: string;
        role: string;
        plan: string;
        subscriptionStatus: string | null;
        billingCycle: string | null;
        currentPeriodEnd: Date | null;
        paddleCustomerId: string | null;
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

// Security middleware
app.use((helmet as any)());
app.use(cors({
  origin: config.CORS_ORIGIN.split(',').map((origin: string) => origin.trim()),
  credentials: true,
}));

// Rate limiting (Memory or Redis)
const createRateLimiter = () => {
  try {
    if (config.RATE_LIMIT_STORE === 'redis' && config.REDIS_URL) {
      const redis = new Redis(config.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        // Auto-pipelining inflates request count on quota-limited providers.
        enableAutoPipelining: false,
      });
      // Swallow connection errors — rate limiter falls back to memory automatically.
      redis.on('error', (err) => logger.warn({ err }, 'Rate-limit Redis error'));
      return rateLimit({
        windowMs: config.RATE_LIMIT_WINDOW_MS,
        max: config.RATE_LIMIT_MAX_REQUESTS,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          error: {
            status: 429,
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP, please try again later.',
          },
        },
        store: new RedisStore({
          // @ts-ignore type mismatch from store interface
          sendCommand: (...args: string[]) => redis.call(...args as [string, ...string[]]) as unknown as Promise<unknown>,
          prefix: 'rate-limit:',
        }) as unknown as RateLimitStore,
      });
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to initialize Redis rate limiter; falling back to memory');
  }
  return rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
      },
    },
  });
};
app.use(createRateLimiter());

// Basic middleware
app.use(compression());
app.use(express.json({ limit: config.REQUEST_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Custom middleware
app.use(requestIdMiddleware);
app.use(httpLogger);
app.use(dbLogger);

// Routes
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
    
    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(config.PORT, config.HOST, () => {
      logger.info(`🚀 Worker ${process.pid} listening at http://${config.HOST}:${config.PORT} (${config.NODE_ENV})`);
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
        await scraperQueue.drain();
        logger.info('🧹 Stale scraper jobs drained from queue.');
        
        // Clean up active, completed, and failed jobs
        await scraperQueue.clean(0, 0, 'active');
        await scraperQueue.clean(0, 0, 'completed');
        await scraperQueue.clean(0, 0, 'failed');
        await scraperQueue.clean(0, 0, 'delayed');
        
        logger.info('🧹 All scraper job states cleaned from queue.');
      } catch (err) {
        logger.warn({ err }, 'Failed to clean scraper queue on startup');
      }
      
      // Small delay before starting workers to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      startWorkers();
      logger.info('⚙️ Distributed workers started and listening for jobs...');
    }

    // Start Scraper Dispatcher Loop (only if enabled)
    // This schedules scans sequentially - waits for current scan to finish + interval
    const runScraperDispatcher = async () => {
      try {
        logger.info(`🛰 Dispatching scraper jobs to the queue...`);
        const activeUsers = await db.client.user.findMany({
          where: { products: { some: { isActive: true } } },
          select: { id: true }
        });

        const jobIds: string[] = [];
        for (const user of activeUsers) {
          const jobId = `scrape-${user.id}`;
          await scraperQueue.add('scrape-user', { userId: user.id }, {
            jobId,
            removeOnComplete: true,
          });
          jobIds.push(jobId);
        }
        logger.info(`✅ Dispatched jobs for ${activeUsers.length} users, waiting for completion...`);

        // Wait for all jobs to complete
        await waitForJobsToComplete(jobIds);
        logger.info(`✅ All ${activeUsers.length} jobs completed`);
      } catch (err) {
        logger.error({ err }, 'Error in scraper dispatcher');
      }
    };

    const waitForJobsToComplete = async (jobIds: string[]): Promise<void> => {
      const maxWaitTime = 10 * 60 * 1000; // 10 minutes max wait
      const checkInterval = 2000; // Check every 2 seconds
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        const jobs = await Promise.all(jobIds.map(id => scraperQueue.getJob(id)));
        const allCompleted = jobs.every(job => !job || job.finishedOn);
        
        if (allCompleted) {
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
      
      logger.warn('Timeout waiting for jobs to complete, proceeding to next interval');
    };

    const scheduleNextScraperRun = async () => {
      if (config.SCRAPER_INTERVAL_MS > 0) {
        logger.info(`⏳ Waiting ${config.SCRAPER_INTERVAL_MS / 60000} minutes before next scan...`);
        await new Promise(resolve => setTimeout(resolve, config.SCRAPER_INTERVAL_MS));
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
