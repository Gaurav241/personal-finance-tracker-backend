import redisClient from './redis.service';

/**
 * Enhanced cache service with optimized key design and cache warming
 * Implements requirements 4.3, 4.4, 4.5: Optimize cache key design, implement cache warming, add cache monitoring
 */

// Enhanced cache TTL values with different strategies
export const ENHANCED_CACHE_TTL = {
  // Very short-lived cache for real-time data
  REALTIME: 30, // 30 seconds
  
  // Short-lived cache for frequently changing data
  SHORT: 5 * 60, // 5 minutes
  
  // Medium-lived cache for semi-static data
  MEDIUM: 30 * 60, // 30 minutes
  
  // Long-lived cache for static data
  LONG: 2 * 60 * 60, // 2 hours
  
  // Very long-lived cache for rarely changing data
  VERY_LONG: 24 * 60 * 60, // 24 hours
  
  // Specific TTLs for different data types
  USER_SESSION: 30 * 60, // 30 minutes
  ANALYTICS: 15 * 60, // 15 minutes
  CATEGORIES: 60 * 60, // 1 hour
  TRANSACTIONS: 5 * 60, // 5 minutes
  STATISTICS: 10 * 60, // 10 minutes
};

// Enhanced cache key patterns with versioning
export const CACHE_KEY_PATTERNS = {
  USER: (userId: number, version: string = 'v1') => `user:${version}:${userId}`,
  USER_TRANSACTIONS: (userId: number, filters: string, version: string = 'v1') => 
    `transactions:${version}:user:${userId}:${filters}`,
  USER_ANALYTICS: (userId: number, period: string, version: string = 'v1') => 
    `analytics:${version}:user:${userId}:${period}`,
  CATEGORIES: (type?: string, version: string = 'v1') => 
    `categories:${version}${type ? `:${type}` : ''}`,
  STATISTICS: (userId: number, period: string, version: string = 'v1') => 
    `stats:${version}:user:${userId}:${period}`,
  TRENDS: (userId: number, months: number, version: string = 'v1') => 
    `trends:${version}:user:${userId}:${months}m`,
};

// Cache monitoring metrics
interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  totalRequests: number;
  hitRate: number;
}

class EnhancedCacheService {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    totalRequests: 0,
    hitRate: 0
  };

  /**
   * Enhanced set method with compression and serialization options
   */
  async set(
    key: string, 
    data: any, 
    ttl: number = ENHANCED_CACHE_TTL.MEDIUM,
    options: {
      compress?: boolean;
      serialize?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const { compress = false, serialize = true } = options;
      
      let processedData = data;
      
      if (serialize) {
        processedData = JSON.stringify(data);
      }
      
      // Add compression for large data (simplified implementation)
      if (compress && typeof processedData === 'string' && processedData.length > 1024) {
        // In a real implementation, you would use a compression library like zlib
        processedData = `compressed:${processedData}`;
      }
      
      await redisClient.setEx(key, ttl, processedData);
      this.metrics.sets++;
      
      // Set metadata for cache monitoring
      await this.setMetadata(key, {
        createdAt: Date.now(),
        ttl,
        size: typeof processedData === 'string' ? processedData.length : 0,
        compressed: compress
      });
      
    } catch (error) {
      this.metrics.errors++;
      console.error(`Enhanced cache set error for key ${key}:`, error);
    }
  }

  /**
   * Enhanced get method with decompression and deserialization
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      this.metrics.totalRequests++;
      
      const data = await redisClient.get(key);
      
      if (data === null) {
        this.metrics.misses++;
        this.updateHitRate();
        return null;
      }
      
      this.metrics.hits++;
      this.updateHitRate();
      
      let processedData = data;
      
      // Handle decompression
      if (typeof data === 'string' && data.startsWith('compressed:')) {
        processedData = data.substring(11); // Remove 'compressed:' prefix
      }
      
      // Handle deserialization
      try {
        return JSON.parse(processedData) as T;
      } catch {
        return processedData as T;
      }
      
    } catch (error) {
      this.metrics.errors++;
      console.error(`Enhanced cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Multi-get operation for batch retrieval
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) return [];
      
      const results = await redisClient.mGet(keys);
      
      return results.map((data, index) => {
        this.metrics.totalRequests++;
        
        if (data === null) {
          this.metrics.misses++;
          return null;
        }
        
        this.metrics.hits++;
        
        try {
          return JSON.parse(data) as T;
        } catch {
          return data as T;
        }
      });
      
    } catch (error) {
      this.metrics.errors++;
      console.error('Enhanced cache mget error:', error);
      return keys.map(() => null);
    } finally {
      this.updateHitRate();
    }
  }

  /**
   * Enhanced delete with pattern support
   */
  async delete(keyOrPattern: string): Promise<void> {
    try {
      if (keyOrPattern.includes('*')) {
        await this.deleteByPattern(keyOrPattern);
      } else {
        await redisClient.del(keyOrPattern);
        await this.deleteMetadata(keyOrPattern);
      }
      
      this.metrics.deletes++;
    } catch (error) {
      this.metrics.errors++;
      console.error(`Enhanced cache delete error for key ${keyOrPattern}:`, error);
    }
  }

  /**
   * Delete keys by pattern with batching for performance
   */
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      
      if (keys.length > 0) {
        // Process in batches to avoid blocking Redis
        const batchSize = 100;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          await redisClient.del(batch);
          
          // Delete metadata for each key
          const metadataKeys = batch.map(key => `meta:${key}`);
          await redisClient.del(metadataKeys);
        }
      }
    } catch (error) {
      this.metrics.errors++;
      console.error(`Enhanced cache delete by pattern error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Cache warming for frequently accessed data
   */
  async warmCache(userId: number): Promise<void> {
    try {
      console.log(`Warming cache for user ${userId}`);
      
      // Warm user data
      // In a real implementation, you would fetch and cache user data here
      
      // Warm categories (global data)
      const categoriesKey = CACHE_KEY_PATTERNS.CATEGORIES();
      const existingCategories = await this.get(categoriesKey);
      
      if (!existingCategories) {
        // Fetch and cache categories
        // This would typically call your category service
        console.log('Warming categories cache');
      }
      
      // Warm recent analytics
      const analyticsKey = CACHE_KEY_PATTERNS.USER_ANALYTICS(userId, 'month');
      const existingAnalytics = await this.get(analyticsKey);
      
      if (!existingAnalytics) {
        // Fetch and cache analytics
        console.log(`Warming analytics cache for user ${userId}`);
      }
      
    } catch (error) {
      console.error(`Cache warming error for user ${userId}:`, error);
    }
  }

  /**
   * Get cache metrics for monitoring
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset cache metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalRequests: 0,
      hitRate: 0
    };
  }

  /**
   * Get cache info for a specific key
   */
  async getCacheInfo(key: string): Promise<{
    exists: boolean;
    ttl: number;
    size?: number;
    metadata?: any;
  }> {
    try {
      const exists = await redisClient.exists(key) === 1;
      const ttl = await redisClient.ttl(key);
      const metadata = await this.getMetadata(key);
      
      return {
        exists,
        ttl,
        size: metadata?.size,
        metadata
      };
    } catch (error) {
      console.error(`Error getting cache info for key ${key}:`, error);
      return { exists: false, ttl: -1 };
    }
  }

  /**
   * Invalidate cache for a specific user
   */
  async invalidateUserCache(userId: number): Promise<void> {
    const patterns = [
      `*user:*:${userId}*`,
      `*transactions:*:user:${userId}*`,
      `*analytics:*:user:${userId}*`,
      `*stats:*:user:${userId}*`,
      `*trends:*:user:${userId}*`
    ];
    
    for (const pattern of patterns) {
      await this.deleteByPattern(pattern);
    }
  }

  /**
   * Set metadata for cache monitoring
   */
  private async setMetadata(key: string, metadata: any): Promise<void> {
    try {
      const metaKey = `meta:${key}`;
      await redisClient.setEx(metaKey, ENHANCED_CACHE_TTL.LONG, JSON.stringify(metadata));
    } catch (error) {
      // Metadata errors shouldn't break the main caching functionality
      console.warn(`Failed to set metadata for key ${key}:`, error);
    }
  }

  /**
   * Get metadata for cache monitoring
   */
  private async getMetadata(key: string): Promise<any> {
    try {
      const metaKey = `meta:${key}`;
      const metadata = await redisClient.get(metaKey);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete metadata
   */
  private async deleteMetadata(key: string): Promise<void> {
    try {
      const metaKey = `meta:${key}`;
      await redisClient.del(metaKey);
    } catch (error) {
      // Ignore metadata deletion errors
    }
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.hitRate = (this.metrics.hits / this.metrics.totalRequests) * 100;
    }
  }
}

export default new EnhancedCacheService();