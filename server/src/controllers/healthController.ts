import { Request, Response } from 'express';
import { db } from '../lib/db.js';
import { pipelineQueue } from '../lib/queue.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../lib/logger.js';

export const healthCheck = asyncHandler(async (req: Request, res: Response) => {
  const dbHealth = await db.healthCheck();
  
  let redisHealth = false;
  try {
    const client = await (pipelineQueue as any).client;
    const ping = await client.ping();
    redisHealth = ping === 'PONG';
  } catch (err) {
    logger.error({ err }, 'Redis health check failed');
  }

  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  const health = {
    status: (dbHealth && redisHealth) ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime)} seconds`,
    database: dbHealth ? 'connected' : 'disconnected',
    redis: redisHealth ? 'connected' : 'disconnected',
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
    },
    node: process.version,
  };

  res.status((dbHealth && redisHealth) ? 200 : 503).json({
    success: true,
    data: health,
    requestId: req.requestId,
  });
});

export const getRequestLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = Math.min(parseInt(req.query['limit'] as string) || 50, 100);
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    db.client.requestLog.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    db.client.requestLog.count(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
    requestId: req.requestId,
  });
});
