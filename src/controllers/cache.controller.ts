import { Request, Response } from 'express';
import EnhancedCacheService from '../services/enhanced-cache.service';

/**
 * Controller for cache monitoring and management
 * Implements requirement 4.5: Add cache monitoring
 */
export class CacheController {
  /**
   * Get cache metrics
   * @route GET /api/v1/cache/metrics
   */
  static async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = EnhancedCacheService.getMetrics();
      
      res.status(200).json({
        status: 'success',
        data: {
          ...metrics,
          hitRateFormatted: `${metrics.hitRate.toFixed(2)}%`,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting cache metrics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve cache metrics'
      });
    }
  }

  /**
   * Get cache info for a specific key
   * @route GET /api/v1/cache/info/:key
   */
  static async getCacheInfo(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      
      if (!key) {
        res.status(400).json({
          status: 'error',
          message: 'Cache key is required'
        });
        return;
      }
      
      const info = await EnhancedCacheService.getCacheInfo(key);
      
      res.status(200).json({
        status: 'success',
        data: info
      });
    } catch (error) {
      console.error('Error getting cache info:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve cache info'
      });
    }
  }

  /**
   * Warm cache for a user
   * @route POST /api/v1/cache/warm/:userId
   */
  static async warmUserCache(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        res.status(400).json({
          status: 'error',
          message: 'Valid user ID is required'
        });
        return;
      }
      
      // Only allow users to warm their own cache, or admins to warm any cache
      if (req.user?.role !== 'admin' && req.user?.id !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'You can only warm your own cache'
        });
        return;
      }
      
      await EnhancedCacheService.warmCache(userId);
      
      res.status(200).json({
        status: 'success',
        message: `Cache warmed for user ${userId}`
      });
    } catch (error) {
      console.error('Error warming cache:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to warm cache'
      });
    }
  }

  /**
   * Invalidate cache for a user
   * @route DELETE /api/v1/cache/user/:userId
   */
  static async invalidateUserCache(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        res.status(400).json({
          status: 'error',
          message: 'Valid user ID is required'
        });
        return;
      }
      
      // Only allow users to invalidate their own cache, or admins to invalidate any cache
      if (req.user?.role !== 'admin' && req.user?.id !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'You can only invalidate your own cache'
        });
        return;
      }
      
      await EnhancedCacheService.invalidateUserCache(userId);
      
      res.status(200).json({
        status: 'success',
        message: `Cache invalidated for user ${userId}`
      });
    } catch (error) {
      console.error('Error invalidating cache:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to invalidate cache'
      });
    }
  }

  /**
   * Reset cache metrics
   * @route POST /api/v1/cache/metrics/reset
   */
  static async resetMetrics(req: Request, res: Response): Promise<void> {
    try {
      EnhancedCacheService.resetMetrics();
      
      res.status(200).json({
        status: 'success',
        message: 'Cache metrics reset successfully'
      });
    } catch (error) {
      console.error('Error resetting cache metrics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to reset cache metrics'
      });
    }
  }
}