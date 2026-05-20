import { Request, Response } from 'express';
import { db } from '../lib/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const healthCheck = asyncHandler(async (req: Request, res: Response) => {
  const dbHealth = await db.healthCheck();
  
  if (!dbHealth) {
    res.status(503).json({
      status: 'unhealthy'
    });
    return;
  }

  res.status(200).json({
    status: 'healthy'
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

export const getPublicConfig = asyncHandler(async (req: Request, res: Response) => {
  const configs = await db.client.systemConfig.findMany({
    where: {
      key: {
        in: ['maintenanceMode', 'registrationEnabled']
      }
    }
  });

  const configMap = configs.reduce<Record<string, any>>((acc, c) => ({ ...acc, [c.key]: c.value }), {});

  res.status(200).json({
    success: true,
    data: {
      maintenanceMode: configMap.maintenanceMode ?? false,
      registrationEnabled: configMap.registrationEnabled ?? true,
    },
    requestId: req.requestId,
  });
});
