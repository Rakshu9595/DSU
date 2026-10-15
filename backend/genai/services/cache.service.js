
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 500;

const cache = new Map();

function normalizeKey(key) {
  if (typeof key !== "string" || !key.trim()) {
    throw new Error("Cache key must be a non-empty string.");
  }

  return key.trim();
}

function removeExpiredEntries() {
  const now = Date.now();

  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
}

function enforceCacheLimit() {
  while (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;

    if (oldestKey === undefined) {
      break;
    }

    cache.delete(oldestKey);
  }
}

/**
 * Store a value in the cache.
 *
 * @param {string} key
 * @param {*} value
 * @param {number} ttlMs - Time to live in milliseconds.
 */
export function setCache(key, value, ttlMs = DEFAULT_TTL_MS) {
  const normalizedKey = normalizeKey(key);

  if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new Error("Cache TTL must be a positive number.");
  }

  removeExpiredEntries();

  // Refresh the insertion order if the key already exists.
  cache.delete(normalizedKey);

  enforceCacheLimit();

  cache.set(normalizedKey, {
    value,
    expiresAt: Date.now() + ttlMs
  });

  return true;
}

/**
 * Retrieve a cached value.
 * Returns undefined if the key is missing or expired.
 */
export function getCache(key) {
  const normalizedKey = normalizeKey(key);
  const entry = cache.get(normalizedKey);

  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(normalizedKey);
    return undefined;
  }

  return entry.value;
}

/**
 * Check whether a non-expired key exists.
 */
export function hasCache(key) {
  return getCache(key) !== undefined;
}

/**
 * Delete one cache entry.
 */
export function deleteCache(key) {
  return cache.delete(normalizeKey(key));
}

/**
 * Clear all cached entries.
 */
export function clearCache() {
  cache.clear();
}

/**
 * Return basic cache statistics.
 */
export function getCacheStats() {
  removeExpiredEntries();

  return {
    entries: cache.size,
    maxEntries: MAX_CACHE_ENTRIES,
    defaultTtlMs: DEFAULT_TTL_MS
  };
}

export default {
  setCache,
  getCache,
  hasCache,
  deleteCache,
  clearCache,
  getCacheStats
};
