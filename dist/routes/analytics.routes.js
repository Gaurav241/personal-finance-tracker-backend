"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiting_middleware_1 = require("../middleware/rateLimiting.middleware");
const performance_middleware_1 = require("../middleware/performance.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = (0, express_1.Router)();
// All analytics routes require authentication and have rate limiting
router.use(auth_middleware_1.authenticateToken);
router.use(rateLimiting_middleware_1.analyticsLimiter);
/**
 * @route GET /api/v1/analytics/summary
 * @desc Get analytics summary for the authenticated user
 * @access Private (admin, user, read-only)
 */
router.get('/summary', performance_middleware_1.mediumTermCache, (0, auth_middleware_1.authorizeRole)(['admin', 'user', 'read-only']), validation_middleware_1.validateAnalyticsQuery, analytics_controller_1.AnalyticsController.getAnalyticsSummary);
/**
 * @route GET /api/v1/analytics/trends/monthly
 * @desc Get monthly trends data
 * @access Private (admin, user, read-only)
 */
router.get('/trends/monthly', (0, auth_middleware_1.authorizeRole)(['admin', 'user', 'read-only']), validation_middleware_1.validateAnalyticsQuery, analytics_controller_1.AnalyticsController.getMonthlyTrends);
/**
 * @route GET /api/v1/analytics/trends/category/:categoryId
 * @desc Get category spending trends
 * @access Private (admin, user, read-only)
 */
router.get('/trends/category/:categoryId', (0, auth_middleware_1.authorizeRole)(['admin', 'user', 'read-only']), validation_middleware_1.validateUserId, validation_middleware_1.validateAnalyticsQuery, analytics_controller_1.AnalyticsController.getCategoryTrends);
/**
 * @route GET /api/v1/analytics/breakdown/:type
 * @desc Get category breakdown data (income or expense)
 * @access Private (admin, user, read-only)
 */
router.get('/breakdown/:type', (0, auth_middleware_1.authorizeRole)(['admin', 'user', 'read-only']), analytics_controller_1.AnalyticsController.getCategoryBreakdown);
/**
 * @route GET /api/v1/analytics/budget
 * @desc Get budget vs actual spending comparison
 * @access Private (admin, user, read-only)
 */
router.get('/budget', (0, auth_middleware_1.authorizeRole)(['admin', 'user', 'read-only']), analytics_controller_1.AnalyticsController.getBudgetComparison);
/**
 * @route GET /api/v1/analytics/insights
 * @desc Get financial insights and recommendations
 * @access Private (admin, user, read-only)
 */
router.get('/insights', (0, auth_middleware_1.authorizeRole)(['admin', 'user', 'read-only']), analytics_controller_1.AnalyticsController.getFinancialInsights);
exports.default = router;
