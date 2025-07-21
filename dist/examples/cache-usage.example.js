"use strict";
/**
 * This file provides examples of how to use the cache service in controllers
 * It is not meant to be imported or used directly in the application
 */
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
exports.getCategories = exports.updateTransaction = exports.getAnalytics = void 0;
const cache_service_1 = __importStar(require("../services/cache.service"));
/**
 * Example: Get analytics data with caching
 */
const getAnalytics = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user ID is available from auth middleware
        const period = req.query.period || 'month';
        // Generate cache key for this specific analytics request
        const cacheKey = cache_service_1.default.getAnalyticsKey(userId, period);
        // Try to get data from cache first
        const cachedData = await cache_service_1.default.get(cacheKey);
        if (cachedData) {
            // Return cached data if available
            return res.status(200).json({
                status: 'success',
                data: cachedData,
                source: 'cache'
            });
        }
        // If not in cache, generate analytics data (example function)
        const analyticsData = await generateAnalyticsData(userId, period);
        // Store in cache with analytics TTL (15 minutes)
        await cache_service_1.default.set(cacheKey, analyticsData, cache_service_1.CACHE_TTL.ANALYTICS);
        // Return the fresh data
        return res.status(200).json({
            status: 'success',
            data: analyticsData,
            source: 'database'
        });
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch analytics data'
        });
    }
};
exports.getAnalytics = getAnalytics;
/**
 * Example: Update a transaction and invalidate related caches
 */
const updateTransaction = async (req, res) => {
    try {
        const userId = req.user.id;
        const transactionId = parseInt(req.params.id);
        const transactionData = req.body;
        // Update transaction in database (example function)
        const updatedTransaction = await updateTransactionInDb(transactionId, transactionData);
        // Invalidate all analytics cache for this user (requirement 4.5)
        await cache_service_1.default.invalidateUserAnalytics(userId);
        // Invalidate transaction cache for this user
        await cache_service_1.default.invalidateUserTransactions(userId);
        return res.status(200).json({
            status: 'success',
            data: updatedTransaction
        });
    }
    catch (error) {
        console.error('Error updating transaction:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to update transaction'
        });
    }
};
exports.updateTransaction = updateTransaction;
/**
 * Example: Get categories with caching
 */
const getCategories = async (req, res) => {
    try {
        // Categories are shared data, so we can use a global cache key
        const cacheKey = cache_service_1.default.getCategoriesKey();
        // Try to get from cache first
        const cachedCategories = await cache_service_1.default.get(cacheKey);
        if (cachedCategories) {
            return res.status(200).json({
                status: 'success',
                data: cachedCategories,
                source: 'cache'
            });
        }
        // If not in cache, fetch from database (example function)
        const categories = await fetchCategoriesFromDb();
        // Store in cache with categories TTL (1 hour)
        await cache_service_1.default.set(cacheKey, categories, cache_service_1.CACHE_TTL.CATEGORIES);
        return res.status(200).json({
            status: 'success',
            data: categories,
            source: 'database'
        });
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch categories'
        });
    }
};
exports.getCategories = getCategories;
// Mock functions for the examples
async function generateAnalyticsData(userId, period) {
    // This would be replaced with actual database queries and calculations
    return {
        totalIncome: 5000,
        totalExpenses: 3500,
        netIncome: 1500,
        categoryBreakdown: [
            { category: 'Food', amount: 1200 },
            { category: 'Rent', amount: 1500 },
            { category: 'Entertainment', amount: 800 }
        ]
    };
}
async function updateTransactionInDb(transactionId, data) {
    // This would be replaced with actual database update
    return {
        id: transactionId,
        ...data,
        updatedAt: new Date()
    };
}
async function fetchCategoriesFromDb() {
    // This would be replaced with actual database query
    return [
        { id: 1, name: 'Food', type: 'expense' },
        { id: 2, name: 'Rent', type: 'expense' },
        { id: 3, name: 'Salary', type: 'income' }
    ];
}
