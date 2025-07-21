import { Router } from 'express';
import { CacheController } from '../controllers/cache.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminLimiter } from '../middleware/rateLimiting.middleware';
import { noCache } from '../middleware/performance.middleware';

const router = Router();

// All cache routes require authentication and no caching
router.use(...authMiddleware());
router.use(noCache);
router.use(adminLimiter);

/**
 * @route GET /api/v1/cache/metrics
 * @desc Get cache performance metrics
 * @access Admin only
 */
router.get('/metrics', ...authMiddleware(['admin']), CacheController.getMetrics);

/**
 * @route GET /api/v1/cache/info/:key
 * @desc Get cache info for a specific key
 * @access Admin only
 */
router.get('/info/:key', ...authMiddleware(['admin']), CacheController.getCacheInfo);

/**
 * @route POST /api/v1/cache/warm/:userId
 * @desc Warm cache for a specific user
 * @access User (own cache) or Admin (any cache)
 */
router.post('/warm/:userId', CacheController.warmUserCache);

/**
 * @route DELETE /api/v1/cache/user/:userId
 * @desc Invalidate cache for a specific user
 * @access User (own cache) or Admin (any cache)
 */
router.delete('/user/:userId', CacheController.invalidateUserCache);

/**
 * @route POST /api/v1/cache/metrics/reset
 * @desc Reset cache metrics
 * @access Admin only
 */
router.post('/metrics/reset', ...authMiddleware(['admin']), CacheController.resetMetrics);

export default router;