import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../lib/db.js';
import { config } from '../lib/config.js';
import logger from '../lib/logger.js';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.['token'] || req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Unauthorized - No token provided' });
      return;
    }

    // Verify JWT integrity
    jwt.verify(token, config.JWT_SECRET);

    // Verify stateful session exists (prevents revoked tokens from working)
    const session = await db.client.session.findUnique({
      where: { sessionToken: token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            plan: true,
            metadata: true,
            subscriptionStatus: true,
            billingCycle: true,
            currentPeriodEnd: true,
            paddleCustomerId: true,
            isScanning: true,
            lastScanStatus: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (!session || session.expiresAt < new Date()) {
      res.clearCookie('token', {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      res.status(401).json({ error: 'Unauthorized - Session expired or invalid' });
      return;
    }

    // Attach user payload to request
    req.user = session.user as any;
    next();
  } catch (error) {
    logger.warn({ error }, 'Auth middleware token verification failed');
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
    const token = req.cookies?.['token'] || req.headers.authorization?.split(' ')[1];
    if (!token) return next();

    const session = await db.client.session.findUnique({
      where: { sessionToken: token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            plan: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (session && session.expiresAt > new Date()) {
      req.user = session.user as any;
    }
    next();
  } catch (error) {
    next();
  }
};
