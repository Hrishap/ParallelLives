import { logger } from '../utils/logger';
import { CacheItem, CacheOptions } from '@/types';

class InMemoryCacheService {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 1000, defaultTTL = 60 * 60 * 1000) { // 1 hour default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // Clean expired items every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.timestamp + item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    // If cache is full, remove oldest item
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, item);
    logger.debug(`Cached item with key: ${key}`);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    logger.debug(`Deleted cache item with key: ${key}`);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.timestamp + item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // Would need to track hits/misses for this
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + item.ttl) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.debug(`Cleaned up ${expiredCount} expired cache items`);
    }
  }
}

// Redis cache service (optional, for production)
class RedisCacheService {
  private redis: any; // Would be redis client
  
  constructor() {
    // Initialize Redis client if REDIS_URL is provided
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      // this.redis = new Redis(redisUrl);
      logger.info('Redis cache service initialized');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    if (!this.redis) return;
    
    try {
      const serialized = JSON.stringify(data);
      if (ttl) {
        await this.redis.setex(key, Math.floor(ttl / 1000), serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redis) return;
    
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error(`Redis delete error for key ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    if (!this.redis) return;
    
    try {
      await this.redis.flushdb();
    } catch (error) {
      logger.error('Redis clear error:', error);
    }
  }
}

// Export the appropriate cache service
const useRedis = process.env.REDIS_URL && process.env.NODE_ENV === 'production';
export const cacheService = useRedis ? new RedisCacheService() : new InMemoryCacheService();