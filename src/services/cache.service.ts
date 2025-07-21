import redisClient from './redis.service';

/**
 * Cache TTL values in seconds
 */
export const CACHE_TTL = {
  // Analytics data - 15 minutes (requirement 4.3)
  ANALYTICS: 15 * 60,
  // Category data - 1 hour (requirement 4.4)
  CATEGORIES: 60 * 60,
  // User data - 30 minutes
  USER: 30 * 60,
  // Transaction list - 5 minutes
  TRANSACTIONS: 5 * 60,
  // Default TTL - 10 minutes
  DEFAULT: 10 * 60
};

/**
 * Cache key prefixes for different data types
 */
export const CACHE_KEYS = {
  ANALYTICS: 'analytics',
  CATEGORIES: 'categories',
  USER: 'user',
  TRANSACTIONS: 'transactions'
};

/**
 * Cache service for managing Redis cache operations
 */
export class CacheService {
  /**
   * Set data in cache with expiration
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in seconds
   */
  static async set(key: string, data: any, ttl: number = CACHE_TTL.DEFAULT): Promise<void> {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error(`Error setting cache for key ${key}:`, error);
    }
  }

  /**
   * Get data from cache
   * @param key Cache key
   * @returns Cached data or null if not found
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) as T : null;
    } catch (error) {
      console.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete data from cache
   * @param key Cache key
   */
  static async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error(`Error deleting cache for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * @param pattern Key pattern to match
   */
  static async deleteByPattern(pattern: string): Promise<void> {
    try {
      // Get all keys matching the pattern
      const keys = await redisClient.keys(pattern);
      
      // Delete all matching keys if any exist
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error(`Error deleting cache by pattern ${pattern}:`, error);
    }
  }

  /**
   * Generate analytics cache key
   * @param userId User ID
   * @param period Time period (e.g., 'month', 'year')
   * @returns Cache key for analytics data
   */
  static getAnalyticsKey(userId: number, period: string): string {
    return `${CACHE_KEYS.ANALYTICS}:${userId}:${period}`;
  }

  /**
   * Generate categories cache key
   * @param userId User ID (optional)
   * @returns Cache key for categories data
   */
  static getCategoriesKey(userId?: number): string {
    return userId 
      ? `${CACHE_KEYS.CATEGORIES}:${userId}` 
      : CACHE_KEYS.CATEGORIES;
  }

  /**
   * Generate transactions cache key
   * @param userId User ID
   * @param filters Optional filters object
   * @returns Cache key for transactions data
   */
  static getTransactionsKey(userId: number, filters?: Record<string, any>): string {
    const filterString = filters ? `:${JSON.stringify(filters)}` : '';
    return `${CACHE_KEYS.TRANSACTIONS}:${userId}${filterString}`;
  }

  /**
   * Generate user cache key
   * @param userId User ID
   * @returns Cache key for user data
   */
  static getUserKey(userId: number): string {
    return `${CACHE_KEYS.USER}:${userId}`;
  }

  /**
   * Invalidate all analytics cache for a user when transactions are updated
   * This implements requirement 4.5
   * @param userId User ID
   */
  static async invalidateUserAnalytics(userId: number): Promise<void> {
    await this.deleteByPattern(`${CACHE_KEYS.ANALYTICS}:${userId}:*`);
  }

  /**
   * Invalidate transaction cache for a user
   * @param userId User ID
   */
  static async invalidateUserTransactions(userId: number): Promise<void> {
    await this.deleteByPattern(`${CACHE_KEYS.TRANSACTIONS}:${userId}*`);
  }
}

export default CacheService;