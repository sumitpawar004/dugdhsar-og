import { WorkerEnv } from '../types';
import { logger } from '../logger';

export const CACHE_KEYS = {
  PRODUCTS: 'cache:catalog:products',
  CATEGORIES: 'cache:catalog:categories',
  PURITY: 'cache:catalog:purity',
  INSTAGRAM_FEED: 'ig_feed_cache',
};

// In-memory cache for local development or fast isolate hits
const localCache = new Map<string, { data: any; expiresAt: number }>();

/**
 * Get cached item from Workers KV or local memory
 */
export async function getCached<T>(key: string, env?: WorkerEnv): Promise<T | null> {
  // Check local memory first
  const memoryHit = localCache.get(key);
  if (memoryHit) {
    if (Date.now() < memoryHit.expiresAt) {
      return memoryHit.data as T;
    }
    localCache.delete(key);
  }

  // Check Workers KV
  if (env?.CACHE) {
    try {
      const raw = await env.CACHE.get(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed as T;
      }
    } catch (err: any) {
      logger.warn(`[CacheService] KV get failed for ${key}`, { error: err.message });
    }
  }

  return null;
}

/**
 * Put item in cache with TTL
 */
export async function setCached<T>(
  key: string,
  data: T,
  envOrTtl?: WorkerEnv | number,
  ttlOrEnv?: number | WorkerEnv
): Promise<void> {
  let env: WorkerEnv | undefined;
  let ttlSeconds = 3600;

  if (typeof envOrTtl === 'number') {
    ttlSeconds = envOrTtl;
    env = ttlOrEnv as WorkerEnv | undefined;
  } else {
    env = envOrTtl as WorkerEnv | undefined;
    if (typeof ttlOrEnv === 'number') {
      ttlSeconds = ttlOrEnv;
    }
  }

  localCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  if (env?.CACHE) {
    try {
      await env.CACHE.put(key, JSON.stringify(data), {
        expirationTtl: ttlSeconds,
      });
    } catch (err: any) {
      logger.warn(`[CacheService] KV put failed for ${key}`, { error: err.message });
    }
  }
}

/**
 * Event-Driven Cache Invalidation:
 * Automatically purges public catalog caches when products, prices, or batches are updated.
 */
export async function invalidateCatalogCache(env?: WorkerEnv): Promise<void> {
  localCache.delete(CACHE_KEYS.PRODUCTS);
  localCache.delete(CACHE_KEYS.CATEGORIES);
  localCache.delete(CACHE_KEYS.PURITY);

  if (env?.CACHE) {
    try {
      await Promise.all([
        env.CACHE.delete(CACHE_KEYS.PRODUCTS),
        env.CACHE.delete(CACHE_KEYS.CATEGORIES),
        env.CACHE.delete(CACHE_KEYS.PURITY),
      ]);
      logger.info('[CacheService] Catalog caches successfully invalidated at edge');
    } catch (err: any) {
      logger.warn('[CacheService] KV cache invalidation failed', { error: err.message });
    }
  }
}
