import { Request, Response, NextFunction } from 'express';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';

export const checkMaintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Exclude public health checks, webhooks, and admin console APIs
    const isExcludedPath = 
      req.path === '/' || 
      req.path === '/api' || 
      req.path === '/api/health' || 
      req.path.startsWith('/api/auth') || 
      req.path.startsWith('/api/admin') || 
      req.path.startsWith('/api/webhooks');

    if (isExcludedPath) {
      return next();
    }

    // 2. Fetch the maintenance flag from database
    const maintConfig = await db.client.systemConfig.findUnique({
      where: { key: 'maintenanceMode' }
    });

    const isMaintenance = maintConfig ? (maintConfig.value as boolean) : false;

    // 3. If active and the request is not from an Admin, block it
    if (isMaintenance && req.user?.role !== 'admin') {
      logger.warn({ path: req.path, userId: req.user?.id }, 'Blocking request due to Maintenance Mode');
      res.status(503).json({
        success: false,
        error: {
          status: 503,
          code: 'MAINTENANCE_MODE',
          message: 'Knivik is currently undergoing scheduled maintenance. Please try again shortly.',
        }
      });
      return;
    }

    next();
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error checking maintenance mode status');
    // Default to passing the request in case of database glitches so we don't bring the site down entirely
    next();
  }
};
