import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// All analytics routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/v1/analytics/summary
 * @desc Get analytics summary for the authenticated user
 * @access Private (admin, user, read-only)
 */
router.get('/summary', authorizeRole(['admin', 'user', 'read-only']), AnalyticsController.getAnalyticsSummary);

/**
 * @route GET /api/v1/analytics/trends/monthly
 * @desc Get monthly trends data
 * @access Private (admin, user, read-only)
 */
router.get('/trends/monthly', authorizeRole(['admin', 'user', 'read-only']), AnalyticsController.getMonthlyTrends);

/**
 * @route GET /api/v1/analytics/trends/category/:categoryId
 * @desc Get category spending trends
 * @access Private (admin, user, read-only)
 */
router.get('/trends/category/:categoryId', authorizeRole(['admin', 'user', 'read-only']), AnalyticsController.getCategoryTrends);

/**
 * @route GET /api/v1/analytics/breakdown/:type
 * @desc Get category breakdown data (income or expense)
 * @access Private (admin, user, read-only)
 */
router.get('/breakdown/:type', authorizeRole(['admin', 'user', 'read-only']), AnalyticsController.getCategoryBreakdown);

/**
 * @route GET /api/v1/analytics/budget
 * @desc Get budget vs actual spending comparison
 * @access Private (admin, user, read-only)
 */
router.get('/budget', authorizeRole(['admin', 'user', 'read-only']), AnalyticsController.getBudgetComparison);

/**
 * @route GET /api/v1/analytics/insights
 * @desc Get financial insights and recommendations
 * @access Private (admin, user, read-only)
 */
router.get('/insights', authorizeRole(['admin', 'user', 'read-only']), AnalyticsController.getFinancialInsights);

export default router;