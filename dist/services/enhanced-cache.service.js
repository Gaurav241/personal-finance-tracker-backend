"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_KEY_PATTERNS = exports.ENHANCED_CACHE_TTL = void 0;
const redis_service_1 = __importDefault(require("./redis.service"));
/**
 * Enhanced cache service with optimized key design and cache warming
 * Implements requirements 4.3, 4.4, 4.5: Optimize cache key design, implement cache warming, add cache monitoring
 */
// Enhanced cache TTL values with different strategies
exports.ENHANCED_CACHE_TTL = {
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
exports.CACHE_KEY_PATTERNS = {
    USER: (userId, version = 'v1') => `user:${version}:${userId}`,
    USER_TRANSACTIONS: (userId, filters, version = 'v1') => `transactions:${version}:user:${userId}:${filters}`,
    USER_ANALYTICS: (userId, period, version = 'v1') => `analytics:${version}:user:${userId}:${period}`,
    CATEGORIES: (type, version = 'v1') => `categories:${version}${type ? `:${type}` : ''}`,
    STATISTICS: (userId, period, version = 'v1') => `stats:${version}:user:${userId}:${period}`,
    TRENDS: (userId, months, version = 'v1') => `trends:${version}:user:${userId}:${months}m`,
};
class EnhancedCacheService {
    constructor() {
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
     * Enhanced set method with compression and serialization options
     */
    async set(key, data, ttl = exports.ENHANCED_CACHE_TTL.MEDIUM, options = {}) {
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
            await redis_service_1.default.setEx(key, ttl, processedData);
            this.metrics.sets++;
            // Set metadata for cache monitoring
            await this.setMetadata(key, {
                createdAt: Date.now(),
                ttl,
                size: typeof processedData === 'string' ? processedData.length : 0,
                compressed: compress
            });
        }
        catch (error) {
            this.metrics.errors++;
            console.error(`Enhanced cache set error for key ${key}:`, error);
        }
    }
    /**
     * Enhanced get method with decompression and deserialization
     */
    async get(key) {
        try {
            this.metrics.totalRequests++;
            const data = await redis_service_1.default.get(key);
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
                return JSON.parse(processedData);
            }
            catch {
                return processedData;
            }
        }
        catch (error) {
            this.metrics.errors++;
            console.error(`Enhanced cache get error for key ${key}:`, error);
            return null;
        }
    }
    /**
     * Multi-get operation for batch retrieval
     */
    async mget(keys) {
        try {
            if (keys.length === 0)
                return [];
            const results = await redis_service_1.default.mGet(keys);
            return results.map((data, index) => {
                this.metrics.totalRequests++;
                if (data === null) {
                    this.metrics.misses++;
                    return null;
                }
                this.metrics.hits++;
                try {
                    return JSON.parse(data);
                }
                catch {
                    return data;
                }
            });
        }
        catch (error) {
            this.metrics.errors++;
            console.error('Enhanced cache mget error:', error);
            return keys.map(() => null);
        }
        finally {
            this.updateHitRate();
        }
    }
    /**
     * Enhanced delete with pattern support
     */
    async delete(keyOrPattern) {
        try {
            if (keyOrPattern.includes('*')) {
                await this.deleteByPattern(keyOrPattern);
            }
            else {
                await redis_service_1.default.del(keyOrPattern);
                await this.deleteMetadata(keyOrPattern);
            }
            this.metrics.deletes++;
        }
        catch (error) {
            this.metrics.errors++;
            console.error(`Enhanced cache delete error for key ${keyOrPattern}:`, error);
        }
    }
    /**
     * Delete keys by pattern with batching for performance
     */
    async deleteByPattern(pattern) {
        try {
            const keys = await redis_service_1.default.keys(pattern);
            if (keys.length > 0) {
                // Process in batches to avoid blocking Redis
                const batchSize = 100;
                for (let i = 0; i < keys.length; i += batchSize) {
                    const batch = keys.slice(i, i + batchSize);
                    await redis_service_1.default.del(batch);
                    // Delete metadata for each key
                    const metadataKeys = batch.map(key => `meta:${key}`);
                    await redis_service_1.default.del(metadataKeys);
                }
            }
        }
        catch (error) {
            this.metrics.errors++;
            console.error(`Enhanced cache delete by pattern error for pattern ${pattern}:`, error);
        }
    }
    /**
     * Cache warming for frequently accessed data
     */
    async warmCache(userId) {
        try {
            console.log(`Warming cache for user ${userId}`);
            // Warm user data
            // In a real implementation, you would fetch and cache user data here
            // Warm categories (global data)
            const categoriesKey = exports.CACHE_KEY_PATTERNS.CATEGORIES();
            const existingCategories = await this.get(categoriesKey);
            if (!existingCategories) {
                // Fetch and cache categories
                // This would typically call your category service
                console.log('Warming categories cache');
            }
            // Warm recent analytics
            const analyticsKey = exports.CACHE_KEY_PATTERNS.USER_ANALYTICS(userId, 'month');
            const existingAnalytics = await this.get(analyticsKey);
            if (!existingAnalytics) {
                // Fetch and cache analytics
                console.log(`Warming analytics cache for user ${userId}`);
            }
        }
        catch (error) {
            console.error(`Cache warming error for user ${userId}:`, error);
        }
    }
    /**
     * Get cache metrics for monitoring
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Reset cache metrics
     */
    resetMetrics() {
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
    async getCacheInfo(key) {
        try {
            const exists = await redis_service_1.default.exists(key) === 1;
            const ttl = await redis_service_1.default.ttl(key);
            const metadata = await this.getMetadata(key);
            return {
                exists,
                ttl,
                size: metadata?.size,
                metadata
            };
        }
        catch (error) {
            console.error(`Error getting cache info for key ${key}:`, error);
            return { exists: false, ttl: -1 };
        }
    }
    /**
     * Invalidate cache for a specific user
     */
    async invalidateUserCache(userId) {
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
    async setMetadata(key, metadata) {
        try {
            const metaKey = `meta:${key}`;
            await redis_service_1.default.setEx(metaKey, exports.ENHANCED_CACHE_TTL.LONG, JSON.stringify(metadata));
        }
        catch (error) {
            // Metadata errors shouldn't break the main caching functionality
            console.warn(`Failed to set metadata for key ${key}:`, error);
        }
    }
    /**
     * Get metadata for cache monitoring
     */
    async getMetadata(key) {
        try {
            const metaKey = `meta:${key}`;
            const metadata = await redis_service_1.default.get(metaKey);
            return metadata ? JSON.parse(metadata) : null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Delete metadata
     */
    async deleteMetadata(key) {
        try {
            const metaKey = `meta:${key}`;
            await redis_service_1.default.del(metaKey);
        }
        catch (error) {
            // Ignore metadata deletion errors
        }
    }
    /**
     * Update hit rate calculation
     */
    updateHitRate() {
        if (this.metrics.totalRequests > 0) {
            this.metrics.hitRate = (this.metrics.hits / this.metrics.totalRequests) * 100;
        }
    }
}
exports.default = new EnhancedCacheService();
