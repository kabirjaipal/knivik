import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger.js';
import { auth } from '../lib/auth.js';
import { fromNodeHeaders } from "better-auth/node";
import { db } from '../lib/db.js';

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

    // Attach user payload to request with dynamic profile resolution
    if (sessionData.user) {
      const dbUser = await db.client.user.findUnique({
        where: { id: sessionData.user.id },
        select: {
          role: true,
          plan: true,
          subscriptionStatus: true,
          dodoCustomerId: true,
          isScanning: true,
          lastScanStatus: true,
          referralPartner: {
            select: { id: true }
          }
        }
      });
      if (dbUser) {
        req.user = {
          ...sessionData.user,
          role: dbUser.role,
          plan: dbUser.plan,
          subscriptionStatus: dbUser.subscriptionStatus,
          dodoCustomerId: dbUser.dodoCustomerId,
          isScanning: dbUser.isScanning ?? false,
          lastScanStatus: dbUser.lastScanStatus,
          allowReferrals: !!dbUser.referralPartner
        } as any;
      } else {
        req.user = sessionData.user as any;
      }
    } else {
      req.user = sessionData.user as any;
    }
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

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const sessionData = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (sessionData?.session && sessionData.session.expiresAt > new Date()) {
      if (sessionData.user) {
        const dbUser = await db.client.user.findUnique({
          where: { id: sessionData.user.id },
          select: {
            role: true,
            plan: true,
            subscriptionStatus: true,
            dodoCustomerId: true,
            isScanning: true,
            lastScanStatus: true,
            referralPartner: {
              select: { id: true }
            }
          }
        });
        if (dbUser) {
          req.user = {
            ...sessionData.user,
            role: dbUser.role,
            plan: dbUser.plan,
            subscriptionStatus: dbUser.subscriptionStatus,
            dodoCustomerId: dbUser.dodoCustomerId,
            isScanning: dbUser.isScanning ?? false,
            lastScanStatus: dbUser.lastScanStatus,
            allowReferrals: !!dbUser.referralPartner
          } as any;
        } else {
          req.user = sessionData.user as any;
        }
      } else {
        req.user = sessionData.user as any;
      }
    }
    next();
  } catch (error) {
    next();
  }
};
