import { Request, Response, NextFunction } from 'express';
import cache from '../lib/cache.js';
import logger from '../lib/logger.js';
import config from '../lib/config.js';

/**
 * Smart Caching Engine (Zero-Config)
 * 1. Automatically caches GET requests by URL + UserID.
 * 2. Automatically tags responses by path (e.g. /api/leads -> 'leads').
 * 3. Automatically purges tags on mutations (POST/PATCH/DELETE).
 */

const getTag = (path: string) => {
  const parts = path.split('/').filter(Boolean);
  return parts[0] === 'api' ? (parts[1] === 'v1' ? parts[2] : parts[1]) : parts[0];
};

export const smartCacheMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!config.ENABLE_CACHE) return next();

  // @ts-ignore
  const userId = req.user?.id;
  if (!userId) return next();

  const tag = getTag(req.path);
  if (!tag) return next();

  const userTag = `user:${userId}:${tag}`;

  // 1. Handle Invalidation on Mutation
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.invalidateTags([userTag]).catch(() => {});
      }
    });
    return next();
  }

  // 2. Handle Caching on GET
  if (req.method === 'GET') {
    const key = `cache:u:${userId}:${req.originalUrl}`;
    try {
      const cached = await cache.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cached);
      }

      const originalJson = res.json;
      res.json = function(body) {
        res.json = originalJson;
        if (res.statusCode === 200 && body?.success) {
          cache.setWithTags(key, body, [userTag], 300).catch(() => {});
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson.call(this, body);
      };
    } catch (err) { logger.warn({ err }, 'Cache fail'); }
  }

  next();
};
