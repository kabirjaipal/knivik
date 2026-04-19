import { Request, Response, NextFunction } from 'express';
import { db } from '../lib/db.js';
import { config } from '../lib/config.js';
import logger from '../lib/logger.js';
import { auth } from '../lib/auth.js';
import { fromNodeHeaders } from "better-auth/node";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Let Better Auth handle extracting and verifying the session cookie
    // We use fromNodeHeaders to ensure compatibility between Express and Better Auth
    const sessionData = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (!sessionData?.session) {
      logger.warn({ path: req.path }, 'Unauthorized access attempt - No session found');
      res.status(401).json({ error: 'Unauthorized - No token provided' });
      return;
    }

    if (sessionData.session.expiresAt < new Date()) {
      res.status(401).json({ error: 'Unauthorized - Session expired or invalid' });
      return;
    }

    // Attach user payload to request
    req.user = sessionData.user as any;
    next();
  } catch (error) {
    logger.error({ error }, 'Auth middleware token verification failed');
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
    return;
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden - Admin access required' });
    return;
  }
  next();
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionData = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (sessionData?.session && sessionData.session.expiresAt > new Date()) {
      req.user = sessionData.user as any;
    }
    next();
  } catch (error) {
    next();
  }
};
