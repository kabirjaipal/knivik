import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser'; // reload triggered
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
import { startSchedulers, stopSchedulers } from './schedulers/index.js';

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
// If TRUST_PROXY is enabled, trust 1 hop (e.g. Render/Cloudflare/AWS ALB). 
// Using a boolean 'true' is insecure and causes express-rate-limit validation errors.
app.set('trust proxy', config.TRUST_PROXY ? 1 : false);

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
  // We set trust proxy to 1 above, so we can disable the trustProxy warning check
  validate: { trustProxy: false },
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
      await stopSchedulers();
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

    // Schedulers are booted below

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
    await initSocket(httpServer);

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

    // Start Centralized Schedulers (Keep-Alive, Scraper Dispatcher, Log Cleanup)
    await startSchedulers();

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
