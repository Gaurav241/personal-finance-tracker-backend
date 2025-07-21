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
exports.AnalyticsService = void 0;
const transaction_service_1 = require("./transaction.service");
const cache_service_1 = __importStar(require("./cache.service"));
/**
 * Analytics service for generating financial insights and reports
 * Implements requirements 3.1, 3.2, 3.3, 3.6, 4.3, 4.5
 */
class AnalyticsService {
    /**
     * Get comprehensive analytics summary for a user
     * @param userId User ID
     * @param period Time period (month, year, all)
     * @returns Promise resolving to analytics summary
     */
    static async getAnalyticsSummary(userId, period = 'month') {
        // Try to get from cache first
        const cacheKey = cache_service_1.default.getAnalyticsKey(userId, period);
        const cachedData = await cache_service_1.default.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        // Calculate date range based on period
        const { startDate, endDate } = this.getDateRange(period);
        // Get basic statistics
        const stats = await transaction_service_1.TransactionService.getTransactionStatistics(userId, startDate, endDate);
        // Get category breakdown for expenses
        const expenseBreakdown = await transaction_service_1.TransactionService.getCategoryBreakdown(userId, 'expense', startDate, endDate);
        // Get category breakdown for income
        const incomeBreakdown = await transaction_service_1.TransactionService.getCategoryBreakdown(userId, 'income', startDate, endDate);
        // Combine category breakdowns
        const categoryBreakdown = [
            ...expenseBreakdown.map(cat => ({
                categoryId: cat.categoryId,
                categoryName: cat.categoryName || 'Uncategorized',
                amount: cat.amount,
                percentage: cat.percentage,
                color: cat.categoryColor || '#CCCCCC'
            })),
            ...incomeBreakdown.map(cat => ({
                categoryId: cat.categoryId,
                categoryName: cat.categoryName || 'Uncategorized',
                amount: cat.amount,
                percentage: cat.percentage,
                color: cat.categoryColor || '#CCCCCC'
            }))
        ];
        // Get monthly trends
        const monthlyTrends = await transaction_service_1.TransactionService.getMonthlyTrends(userId, 12);
        const result = {
            totalIncome: stats.totalIncome,
            totalExpenses: stats.totalExpense,
            netIncome: stats.netIncome,
            transactionCount: stats.transactionCount,
            categoryBreakdown,
            monthlyTrends
        };
        // Cache the result
        await cache_service_1.default.set(cacheKey, result, cache_service_1.CACHE_TTL.ANALYTICS);
        return result;
    }
    /**
     * Get spending trends by category over time
     * @param userId User ID
     * @param categoryId Category ID
     * @param months Number of months to analyze
     * @returns Promise resolving to spending trends
     */
    static async getCategoryTrends(userId, categoryId, months = 6) {
        // Try to get from cache first
        const cacheKey = `${cache_service_1.CACHE_KEYS.ANALYTICS}:${userId}:category_trends:${categoryId}:${months}`;
        const cachedData = await cache_service_1.default.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        // This would typically involve a more complex database query
        // For now, we'll use the existing transaction service methods
        const trends = await transaction_service_1.TransactionService.getMonthlyTrends(userId, months);
        // Filter and transform for specific category (simplified implementation)
        const categoryTrends = trends.map(trend => ({
            month: trend.month,
            amount: trend.expense, // Simplified - would need category-specific filtering
            transactionCount: 0 // Would need to be calculated from actual data
        }));
        // Cache the result
        await cache_service_1.default.set(cacheKey, categoryTrends, cache_service_1.CACHE_TTL.ANALYTICS);
        return categoryTrends;
    }
    /**
     * Get budget vs actual spending comparison
     * @param userId User ID
     * @param period Time period
     * @returns Promise resolving to budget comparison
     */
    static async getBudgetComparison(userId, period = 'month') {
        // Try to get from cache first
        const cacheKey = `${cache_service_1.CACHE_KEYS.ANALYTICS}:${userId}:budget:${period}`;
        const cachedData = await cache_service_1.default.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        const { startDate, endDate } = this.getDateRange(period);
        // Get actual spending
        const stats = await transaction_service_1.TransactionService.getTransactionStatistics(userId, startDate, endDate);
        const categoryBreakdown = await transaction_service_1.TransactionService.getCategoryBreakdown(userId, 'expense', startDate, endDate);
        // Mock budget data (in a real app, this would come from a budgets table)
        const mockBudgets = [
            { categoryId: 1, categoryName: 'Food', budgetAmount: 500 },
            { categoryId: 2, categoryName: 'Transportation', budgetAmount: 300 },
            { categoryId: 3, categoryName: 'Entertainment', budgetAmount: 200 },
            { categoryId: 4, categoryName: 'Utilities', budgetAmount: 150 }
        ];
        const totalBudget = mockBudgets.reduce((sum, budget) => sum + budget.budgetAmount, 0);
        const categories = mockBudgets.map(budget => {
            const spent = categoryBreakdown.find(cat => cat.categoryId === budget.categoryId);
            const spentAmount = spent ? spent.amount : 0;
            const remainingAmount = budget.budgetAmount - spentAmount;
            const percentageUsed = (spentAmount / budget.budgetAmount) * 100;
            return {
                categoryId: budget.categoryId,
                categoryName: budget.categoryName,
                budgetAmount: budget.budgetAmount,
                spentAmount,
                remainingAmount,
                percentageUsed
            };
        });
        const result = {
            totalBudget,
            totalSpent: stats.totalExpense,
            remainingBudget: totalBudget - stats.totalExpense,
            categories
        };
        // Cache the result
        await cache_service_1.default.set(cacheKey, result, cache_service_1.CACHE_TTL.ANALYTICS);
        return result;
    }
    /**
     * Get financial insights and recommendations
     * @param userId User ID
     * @returns Promise resolving to insights
     */
    static async getFinancialInsights(userId) {
        // Try to get from cache first
        const cacheKey = `${cache_service_1.CACHE_KEYS.ANALYTICS}:${userId}:insights`;
        const cachedData = await cache_service_1.default.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        const currentMonth = this.getDateRange('month');
        const lastMonth = this.getDateRange('lastMonth');
        // Get current and previous month stats
        const currentStats = await transaction_service_1.TransactionService.getTransactionStatistics(userId, currentMonth.startDate, currentMonth.endDate);
        const lastStats = await transaction_service_1.TransactionService.getTransactionStatistics(userId, lastMonth.startDate, lastMonth.endDate);
        const insights = [];
        const recommendations = [];
        // Generate insights based on spending patterns
        if (currentStats.totalExpense > lastStats.totalExpense) {
            const increase = ((currentStats.totalExpense - lastStats.totalExpense) / lastStats.totalExpense) * 100;
            insights.push({
                type: 'warning',
                title: 'Increased Spending',
                message: `Your spending increased by ${increase.toFixed(1)}% compared to last month.`,
                action: 'Review your recent transactions'
            });
        }
        if (currentStats.netIncome < 0) {
            insights.push({
                type: 'warning',
                title: 'Negative Cash Flow',
                message: 'You spent more than you earned this month.',
                action: 'Consider reducing expenses or increasing income'
            });
        }
        else {
            insights.push({
                type: 'success',
                title: 'Positive Cash Flow',
                message: `You saved $${currentStats.netIncome.toFixed(2)} this month.`
            });
        }
        // Get category breakdown for recommendations
        const categoryBreakdown = await transaction_service_1.TransactionService.getCategoryBreakdown(userId, 'expense', currentMonth.startDate, currentMonth.endDate);
        // Generate recommendations based on spending patterns
        const topExpenseCategory = categoryBreakdown[0];
        if (topExpenseCategory && topExpenseCategory.percentage > 30) {
            recommendations.push({
                category: topExpenseCategory.categoryName || 'Unknown',
                suggestion: `Consider reducing spending in ${topExpenseCategory.categoryName} category`,
                potentialSavings: topExpenseCategory.amount * 0.1 // 10% reduction
            });
        }
        const result = { insights, recommendations };
        // Cache the result for shorter time since insights should be more current
        await cache_service_1.default.set(cacheKey, result, cache_service_1.CACHE_TTL.DEFAULT);
        return result;
    }
    /**
     * Invalidate analytics cache when transactions are updated
     * Implements requirement 4.5
     * @param userId User ID
     */
    static async invalidateAnalyticsCache(userId) {
        await cache_service_1.default.invalidateUserAnalytics(userId);
    }
    /**
     * Get date range based on period
     * @param period Time period (month, year, lastMonth, all)
     * @returns Start and end dates
     */
    static getDateRange(period) {
        const now = new Date();
        switch (period) {
            case 'month':
                return {
                    startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
                    endDate: now.toISOString().split('T')[0]
                };
            case 'lastMonth':
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                return {
                    startDate: lastMonth.toISOString().split('T')[0],
                    endDate: endOfLastMonth.toISOString().split('T')[0]
                };
            case 'year':
                return {
                    startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
                    endDate: now.toISOString().split('T')[0]
                };
            case 'all':
            default:
                return {};
        }
    }
}
exports.AnalyticsService = AnalyticsService;
