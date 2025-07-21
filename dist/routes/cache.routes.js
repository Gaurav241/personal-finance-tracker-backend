"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cache_controller_1 = require("../controllers/cache.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiting_middleware_1 = require("../middleware/rateLimiting.middleware");
const performance_middleware_1 = require("../middleware/performance.middleware");
const router = (0, express_1.Router)();
// All cache routes require authentication and no caching
router.use(...(0, auth_middleware_1.authMiddleware)());
router.use(performance_middleware_1.noCache);
router.use(rateLimiting_middleware_1.adminLimiter);
/**
 * @route GET /api/v1/cache/metrics
 * @desc Get cache performance metrics
 * @access Admin only
 */
router.get('/metrics', ...(0, auth_middleware_1.authMiddleware)(['admin']), cache_controller_1.CacheController.getMetrics);
/**
 * @route GET /api/v1/cache/info/:key
 * @desc Get cache info for a specific key
 * @access Admin only
 */
router.get('/info/:key', ...(0, auth_middleware_1.authMiddleware)(['admin']), cache_controller_1.CacheController.getCacheInfo);
/**
 * @route POST /api/v1/cache/warm/:userId
 * @desc Warm cache for a specific user
 * @access User (own cache) or Admin (any cache)
 */
router.post('/warm/:userId', cache_controller_1.CacheController.warmUserCache);
/**
 * @route DELETE /api/v1/cache/user/:userId
 * @desc Invalidate cache for a specific user
 * @access User (own cache) or Admin (any cache)
 */
router.delete('/user/:userId', cache_controller_1.CacheController.invalidateUserCache);
/**
 * @route POST /api/v1/cache/metrics/reset
 * @desc Reset cache metrics
 * @access Admin only
 */
router.post('/metrics/reset', ...(0, auth_middleware_1.authMiddleware)(['admin']), cache_controller_1.CacheController.resetMetrics);
exports.default = router;
