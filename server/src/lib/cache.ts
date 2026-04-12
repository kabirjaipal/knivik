import config from './config.js';
import logger from './logger.js';
import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';

type CacheValue = unknown;

class CacheClient {
  private redis: Redis | undefined;
  private mem = new LRUCache<string, CacheValue>({ max: 5000, ttl: config.CACHE_TTL_SECONDS * 1000 });
  private enabled = config.ENABLE_CACHE;

  constructor() {
  if (this.enabled && config.REDIS_URL) {
      try {
        this.redis = new Redis(config.REDIS_URL, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableAutoPipelining: true,
        });
    this.redis.on('error', (err: unknown) => logger.warn({ err }, 'Redis cache error'));
      } catch (err) {
        logger.warn({ err }, 'Redis init failed; using memory cache');
    this.redis = undefined;
      }
    }
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    if (!this.enabled) return undefined;
  if (this.redis) {
      try {
    // @ts-ignore ambient types are minimal
    const raw = await this.redis.get(key);
        return raw ? (JSON.parse(raw) as T) : undefined;
      } catch {
        // fall through to memory
      }
    }
    return this.mem.get(key) as T | undefined;
  }

  async set(key: string, value: CacheValue, ttlSeconds = config.CACHE_TTL_SECONDS): Promise<void> {
    if (!this.enabled) return;
    const ttlMs = ttlSeconds * 1000;
  if (this.redis) {
      try {
    // @ts-ignore ambient types are minimal
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      } catch {
        // fall back
      }
    }
  this.mem.set(key, value, { ttl: ttlMs });
  }

  async del(key: string) {
    if (this.redis) { try { await (this.redis as any).del(key); } catch {} }
    this.mem.delete(key);
  }

  // Smart Caching: Associate keys with tags for group invalidation
  async setWithTags(key: string, value: CacheValue, tags: string[], ttl = config.CACHE_TTL_SECONDS) {
    if (!this.enabled) return;
    await this.set(key, value, ttl);
    if (this.redis && tags.length > 0) {
      try {
        const pipe = this.redis.pipeline();
        tags.forEach(t => { pipe.sadd(`tag:${t}`, key); pipe.expire(`tag:${t}`, ttl * 2); });
        await pipe.exec();
      } catch (err) { logger.warn({ err }, 'Tag index fail'); }
    }
  }

  async invalidateTags(tags: string[]) {
    if (!this.enabled || !this.redis) return;
    try {
      for (const t of tags) {
        const keys = await this.redis.smembers(`tag:${t}`);
        if (keys.length > 0) { await this.redis.del(...keys, `tag:${t}`); }
      }
    } catch (err) { logger.warn({ err }, 'Tag purge fail'); }
  }
}

export const cache = new CacheClient();
export default cache;
