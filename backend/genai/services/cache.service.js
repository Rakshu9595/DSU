const crypto = require("node:crypto");

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

class CacheService {
  constructor(options = {}) {
    this.cache = new Map();

    this.ttl = options.ttl ?? DEFAULT_TTL;
    this.maxSize = options.maxSize ?? MAX_CACHE_SIZE;

    if (
      !Number.isFinite(this.ttl) ||
      this.ttl <= 0 ||
      !Number.isInteger(this.maxSize) ||
      this.maxSize <= 0
    ) {
      throw new Error("Invalid cache configuration.");
    }

    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Generates a consistent cache key.
   *
   * IMPORTANT:
   * Include user ID, project ID, context version,
   * model and generation settings when relevant.
   */
  generateKey(data) {
    if (data === undefined) {
      throw new Error("Cache key data is required.");
    }

    const serialized = JSON.stringify(data);

    if (typeof serialized !== "string") {
      throw new Error("Invalid cache key data.");
    }

    return crypto
      .createHash("sha256")
      .update(serialized)
      .digest("hex");
  }

  /**
   * Retrieves a cached value.
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Remove expired entries
    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Refresh insertion order for LRU eviction
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.hits++;

    // Return a copy to prevent accidental mutation
    return structuredClone(entry.value);
  }

  /**
   * Stores a value in the cache.
   */
  set(key, value, ttl = this.ttl) {
    if (
      typeof key !== "string" ||
      key.length === 0
    ) {
      throw new Error("A valid cache key is required.");
    }

    if (!Number.isFinite(ttl) || ttl <= 0) {
      throw new Error("TTL must be a positive number.");
    }

    if (value === undefined) {
      throw new Error("Cannot cache undefined.");
    }

    // Copy data before storing
    const safeValue = structuredClone(value);

    // Remove existing entry to refresh its position
    this.cache.delete(key);

    // Remove expired entries
    this.cleanup();

    // Evict least recently used entry if full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value: safeValue,
      expiresAt: Date.now() + ttl
    });

    return true;
  }

  /**
   * Deletes a specific cache entry.
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Removes all expired entries.
   */
  cleanup() {
    const now = Date.now();

    for (const [key, entry] of this.cache) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears all cached entries.
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Returns cache statistics.
   */
  getStats() {
    this.cleanup();

    const total = this.hits + this.misses;

    return {
      entries: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0
        ? 0
        : Number((this.hits / total * 100).toFixed(2))
    };
  }

  /**
   * Checks whether a valid entry exists.
   */
  has(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// Shared cache instance
const cacheService = new CacheService();

module.exports = {
  CacheService,
  cacheService
};
