import { WorkerEnv } from './types';

// In-memory fallback map for local development or when KV is not attached
const memoryCache = new Map<string, { value: string; expiresAt?: number }>();

export async function kvGet(env: WorkerEnv | undefined, key: string): Promise<string | null> {
  try {
    if (env?.CACHE && typeof env.CACHE.get === 'function') {
      return await env.CACHE.get(key);
    }
  } catch (err) {
    console.warn(`[KV] Error reading key "${key}" from Workers KV:`, err);
  }

  // Fallback to in-memory cache
  const item = memoryCache.get(key);
  if (!item) return null;
  if (item.expiresAt && item.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
}

export async function kvGetJSON<T>(env: WorkerEnv | undefined, key: string): Promise<T | null> {
  const raw = await kvGet(env, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function kvPut(
  env: WorkerEnv | undefined,
  key: string,
  value: string,
  options?: { expirationTtl?: number }
): Promise<void> {
  try {
    if (env?.CACHE && typeof env.CACHE.put === 'function') {
      await env.CACHE.put(key, value, options);
      return;
    }
  } catch (err) {
    console.warn(`[KV] Error writing key "${key}" to Workers KV:`, err);
  }

  // Fallback to in-memory cache
  const expiresAt = options?.expirationTtl ? Date.now() + options.expirationTtl * 1000 : undefined;
  memoryCache.set(key, { value, expiresAt });
}

export async function kvPutJSON<T>(
  env: WorkerEnv | undefined,
  key: string,
  value: T,
  options?: { expirationTtl?: number }
): Promise<void> {
  await kvPut(env, key, JSON.stringify(value), options);
}

export async function kvDelete(env: WorkerEnv | undefined, key: string): Promise<void> {
  try {
    if (env?.CACHE && typeof env.CACHE.delete === 'function') {
      await env.CACHE.delete(key);
      return;
    }
  } catch (err) {
    console.warn(`[KV] Error deleting key "${key}" from Workers KV:`, err);
  }

  memoryCache.delete(key);
}
