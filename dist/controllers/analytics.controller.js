"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analytics_service_1 = require("../services/analytics.service");
/**
 * Controller for analytics-related endpoints
 * Implements requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.7
 */
class AnalyticsController {
    /**
     * Get analytics summary for the authenticated user
     * @route GET /api/v1/analytics/summary
     */
    static async getAnalyticsSummary(req, res) {
        try {
            const userId = req.user.id;
            const period = req.query.period || 'month';
            // Validate period parameter
            const validPeriods = ['month', 'year', 'all', 'lastMonth'];
            if (!validPeriods.includes(period)) {
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid period. Must be one of: month, year, all, lastMonth'
                });
                return;
            }
            const summary = await analytics_service_1.AnalyticsService.getAnalyticsSummary(userId, period);
            res.status(200).json({
                status: 'success',
                data: summary
            });
        }
        catch (error) {
            console.error('Error getting analytics summary:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve analytics summary'
            });
        }
    }
    /**
     * Get category spending trends
     * @route GET /api/v1/analytics/trends/category/:categoryId
     */
    static async getCategoryTrends(req, res) {
        try {
            const userId = req.user.id;
            const categoryId = parseInt(req.params.categoryId);
            const months = parseInt(req.query.months) || 6;
            if (isNaN(categoryId)) {
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid category ID'
                });
                return;
            }
            if (months < 1 || months > 24) {
                res.status(400).json({
                    status: 'error',
                    message: 'Months must be between 1 and 24'
                });
                return;
            }
            const trends = await analytics_service_1.AnalyticsService.getCategoryTrends(userId, categoryId, months);
            res.status(200).json({
                status: 'success',
                data: trends
            });
        }
        catch (error) {
            console.error('Error getting category trends:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve category trends'
            });
        }
    }
    /**
     * Get budget vs actual spending comparison
     * @route GET /api/v1/analytics/budget
     */
    static async getBudgetComparison(req, res) {
        try {
            const userId = req.user.id;
            const period = req.query.period || 'month';
            // Validate period parameter
            const validPeriods = ['month', 'year'];
            if (!validPeriods.includes(period)) {
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid period. Must be one of: month, year'
                });
                return;
            }
            const comparison = await analytics_service_1.AnalyticsService.getBudgetComparison(userId, period);
            res.status(200).json({
                status: 'success',
                data: comparison
            });
        }
        catch (error) {
            console.error('Error getting budget comparison:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve budget comparison'
            });
        }
    }
    /**
     * Get financial insights and recommendations
     * @route GET /api/v1/analytics/insights
     */
    static async getFinancialInsights(req, res) {
        try {
            const userId = req.user.id;
            const insights = await analytics_service_1.AnalyticsService.getFinancialInsights(userId);
            res.status(200).json({
                status: 'success',
                data: insights
            });
        }
        catch (error) {
            console.error('Error getting financial insights:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve financial insights'
            });
        }
    }
    /**
     * Get monthly trends data
     * @route GET /api/v1/analytics/trends/monthly
     */
    static async getMonthlyTrends(req, res) {
        try {
            const userId = req.user.id;
            const months = parseInt(req.query.months) || 12;
            if (months < 1 || months > 24) {
                res.status(400).json({
                    status: 'error',
                    message: 'Months must be between 1 and 24'
                });
                return;
            }
            // Use the transaction service method directly for monthly trends
            const { TransactionService } = await Promise.resolve().then(() => __importStar(require('../services/transaction.service')));
            const trends = await TransactionService.getMonthlyTrends(userId, months);
            res.status(200).json({
                status: 'success',
                data: trends
            });
        }
        catch (error) {
            console.error('Error getting monthly trends:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve monthly trends'
            });
        }
    }
    /**
     * Get category breakdown data
     * @route GET /api/v1/analytics/breakdown/:type
     */
    static async getCategoryBreakdown(req, res) {
        try {
            const userId = req.user.id;
            const type = req.params.type;
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            // Validate type parameter
            if (type !== 'income' && type !== 'expense') {
                res.status(400).json({
                    status: 'error',
                    message: 'Type must be either "income" or "expense"'
                });
                return;
            }
            // Use the transaction service method directly for category breakdown
            const { TransactionService } = await Promise.resolve().then(() => __importStar(require('../services/transaction.service')));
            const breakdown = await TransactionService.getCategoryBreakdown(userId, type, startDate, endDate);
            res.status(200).json({
                status: 'success',
                data: breakdown
            });
        }
        catch (error) {
            console.error('Error getting category breakdown:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve category breakdown'
            });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
