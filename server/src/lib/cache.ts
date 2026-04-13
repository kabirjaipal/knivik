import config from './config.js';
import logger from './logger.js';
import { Redis } from 'ioredis';
import { LRUCache } from 'lru-cache';

type CacheValue = unknown;

class CacheClient {
  private redis: Redis | undefined;
  private mem = new LRUCache<string, CacheValue>({ max: 5000, ttl: config.CACHE_TTL_SECONDS * 1000 });
  private readonly enabled = config.ENABLE_CACHE;
  /** True once Redis has been confirmed unreachable and we've emitted the warning. */
  private redisDegraded = false;

  constructor() {
    if (!this.enabled) {
      logger.info('Cache disabled (ENABLE_CACHE=false). Skipping initialisation.');
      return;
    }

    if (!config.REDIS_URL) {
      logger.info('No REDIS_URL provided. Cache is running in memory-only mode (LRU).');
      return;
    }

    try {
      this.redis = new Redis(config.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        // Auto-pipelining inflates request counts on quota-limited providers (e.g. Upstash free tier).
        enableAutoPipelining: false,
        reconnectOnError: (err) => {
          const isQuotaError = err.message.includes('max requests limit exceeded');
          if (isQuotaError) {
            this.markRedisDegraded('Redis quota exceeded; falling back to in-memory cache.', err);
            return false; // Do not reconnect
          }
          return true;
        },
      });

      this.redis.on('error', (err: unknown) => {
        // Only emit the degraded warning once to avoid log spam.
        if (!this.redisDegraded) {
          this.markRedisDegraded('Redis connection error; falling back to in-memory cache.', err);
        }
      });

      this.redis.on('connect', () => {
        logger.info('✅ Redis cache connected.');
      });
    } catch (err) {
      this.markRedisDegraded('Redis initialisation failed; running in memory-only cache mode.', err);
      this.redis = undefined;
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private markRedisDegraded(reason: string, err?: unknown): void {
    this.redisDegraded = true;
    // Emit a prominent console message so it is visible even in non-pretty log modes.
    console.error(`\n❌ [CACHE] ${reason}\n`);
    logger.warn({ err }, `[CACHE] ${reason}`);
    // Destroy the Redis client so future operations fall through to the LRU.
    this.redis?.disconnect();
    this.redis = undefined;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async get<T = unknown>(key: string): Promise<T | undefined> {
    if (!this.enabled) return undefined;
    if (this.redis) {
      try {
        const raw = await this.redis.get(key);
        return raw ? (JSON.parse(raw) as T) : undefined;
      } catch {
        // Redis call failed for this operation — fall through to memory.
      }
    }
    return this.mem.get(key) as T | undefined;
  }

  async set(key: string, value: CacheValue, ttlSeconds = config.CACHE_TTL_SECONDS): Promise<void> {
    if (!this.enabled) return;
    const ttlMs = ttlSeconds * 1000;
    if (this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      } catch {
        // Redis write failed — fall through to memory.
      }
    }
    this.mem.set(key, value, { ttl: ttlMs });
  }

  async del(key: string): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch { /* ignore */ }
    }
    this.mem.delete(key);
  }

  /**
   * Store a value and associate it with one or more tags for group invalidation.
   * Tags are only tracked in Redis; in memory-only mode plain `set` is used.
   */
  async setWithTags(key: string, value: CacheValue, tags: string[], ttl = config.CACHE_TTL_SECONDS): Promise<void> {
    if (!this.enabled) return;
    await this.set(key, value, ttl);
    if (this.redis && tags.length > 0) {
      try {
        const pipe = this.redis.pipeline();
        tags.forEach(tag => {
          pipe.sadd(`tag:${tag}`, key);
          pipe.expire(`tag:${tag}`, ttl * 2);
        });
        await pipe.exec();
      } catch (err) {
        logger.warn({ err }, '[CACHE] Tag index write failed');
      }
    }
  }

  /** Invalidate all cache keys associated with the given tags. No-op in memory-only mode. */
  async invalidateTags(tags: string[]): Promise<void> {
    if (!this.enabled || !this.redis) return;
    try {
      for (const tag of tags) {
        const keys = await this.redis.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          await this.redis.del(...keys, `tag:${tag}`);
        }
      }
    } catch (err) {
      logger.warn({ err }, '[CACHE] Tag purge failed');
    }
  }
}

export const cache = new CacheClient();
export default cache;
