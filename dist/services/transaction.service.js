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
exports.TransactionService = void 0;
const transaction_repository_1 = require("../repositories/transaction.repository");
const category_service_1 = require("./category.service");
const cache_service_1 = __importStar(require("./cache.service"));
/**
 * Service for transaction-related operations
 */
class TransactionService {
    /**
     * Get transactions for a user with optional filtering and pagination
     * @param userId User ID
     * @param filters Optional filter parameters
     * @returns Promise resolving to array of transactions and total count
     */
    static async getUserTransactions(userId, filters = {}) {
        // Try to get from cache first if no search parameters
        const shouldCache = !filters.search && !filters.minAmount && !filters.maxAmount;
        if (shouldCache) {
            const cacheKey = cache_service_1.default.getTransactionsKey(userId, filters);
            const cachedData = await cache_service_1.default.get(cacheKey);
            if (cachedData) {
                return cachedData;
            }
        }
        // If not in cache or shouldn't cache, get from database
        const { transactions, total } = await transaction_repository_1.TransactionRepository.findByUser(userId, filters);
        // Get all category IDs from transactions
        const categoryIds = [...new Set(transactions
                .map(t => t.categoryId)
                .filter(id => id !== null))];
        // Get categories for these transactions
        const categoryMap = new Map();
        if (categoryIds.length > 0) {
            for (const categoryId of categoryIds) {
                const category = await category_service_1.CategoryService.getCategoryById(categoryId);
                if (category) {
                    categoryMap.set(categoryId, category);
                }
            }
        }
        // Map transactions to DTOs with category information
        const transactionDTOs = transactions.map(transaction => this.mapToDTO(transaction, transaction.categoryId ? categoryMap.get(transaction.categoryId) : undefined));
        const result = { transactions: transactionDTOs, total };
        // Store in cache if appropriate
        if (shouldCache) {
            const cacheKey = cache_service_1.default.getTransactionsKey(userId, filters);
            await cache_service_1.default.set(cacheKey, result, cache_service_1.CACHE_TTL.TRANSACTIONS);
        }
        return result;
    }
    /**
     * Get a transaction by ID
     * @param id Transaction ID
     * @param userId User ID for authorization
     * @returns Promise resolving to transaction or null if not found
     */
    static async getTransactionById(id, userId) {
        const transaction = await transaction_repository_1.TransactionRepository.findById(id, userId);
        if (!transaction) {
            return null;
        }
        let category;
        if (transaction.categoryId) {
            const categoryResult = await category_service_1.CategoryService.getCategoryById(transaction.categoryId);
            if (categoryResult) {
                category = categoryResult;
            }
        }
        return this.mapToDTO(transaction, category);
    }
    /**
     * Create a new transaction
     * @param userId User ID
     * @param data Transaction data
     * @returns Promise resolving to created transaction
     */
    static async createTransaction(userId, data) {
        const transaction = await transaction_repository_1.TransactionRepository.create(userId, data);
        // Invalidate caches
        await this.invalidateUserCaches(userId);
        let category;
        if (transaction.categoryId) {
            const categoryResult = await category_service_1.CategoryService.getCategoryById(transaction.categoryId);
            if (categoryResult) {
                category = categoryResult;
            }
        }
        return this.mapToDTO(transaction, category);
    }
    /**
     * Update an existing transaction
     * @param id Transaction ID
     * @param userId User ID for authorization
     * @param data Transaction data to update
     * @returns Promise resolving to updated transaction or null if not found
     */
    static async updateTransaction(id, userId, data) {
        const transaction = await transaction_repository_1.TransactionRepository.update(id, userId, data);
        if (!transaction) {
            return null;
        }
        // Invalidate caches
        await this.invalidateUserCaches(userId);
        let category;
        if (transaction.categoryId) {
            const categoryResult = await category_service_1.CategoryService.getCategoryById(transaction.categoryId);
            if (categoryResult) {
                category = categoryResult;
            }
        }
        return this.mapToDTO(transaction, category);
    }
    /**
     * Delete a transaction
     * @param id Transaction ID
     * @param userId User ID for authorization
     * @returns Promise resolving to boolean indicating success
     */
    static async deleteTransaction(id, userId) {
        const result = await transaction_repository_1.TransactionRepository.delete(id, userId);
        if (result) {
            // Invalidate caches
            await this.invalidateUserCaches(userId);
        }
        return result;
    }
    /**
     * Get transaction statistics for a user
     * @param userId User ID
     * @param startDate Optional start date for filtering
     * @param endDate Optional end date for filtering
     * @returns Promise resolving to transaction statistics
     */
    static async getTransactionStatistics(userId, startDate, endDate) {
        // Try to get from cache first
        const cacheKey = `${cache_service_1.CACHE_KEYS.ANALYTICS}:${userId}:stats:${startDate || 'all'}:${endDate || 'all'}`;
        const cachedStats = await cache_service_1.default.get(cacheKey);
        if (cachedStats) {
            return cachedStats;
        }
        // If not in cache, get from database
        const stats = await transaction_repository_1.TransactionRepository.getStatistics(userId, startDate, endDate);
        // Store in cache
        await cache_service_1.default.set(cacheKey, stats, cache_service_1.CACHE_TTL.ANALYTICS);
        return stats;
    }
    /**
     * Get category breakdown for a user's transactions
     * @param userId User ID
     * @param type Transaction type (income or expense)
     * @param startDate Optional start date for filtering
     * @param endDate Optional end date for filtering
     * @returns Promise resolving to category breakdown
     */
    static async getCategoryBreakdown(userId, type, startDate, endDate) {
        // Try to get from cache first
        const cacheKey = `${cache_service_1.CACHE_KEYS.ANALYTICS}:${userId}:breakdown:${type}:${startDate || 'all'}:${endDate || 'all'}`;
        const cachedBreakdown = await cache_service_1.default.get(cacheKey);
        if (cachedBreakdown) {
            return cachedBreakdown;
        }
        // If not in cache, get from database
        const breakdown = await transaction_repository_1.TransactionRepository.getCategoryBreakdown(userId, type, startDate, endDate);
        // Store in cache
        await cache_service_1.default.set(cacheKey, breakdown, cache_service_1.CACHE_TTL.ANALYTICS);
        return breakdown;
    }
    /**
     * Get monthly trends for a user's transactions
     * @param userId User ID
     * @param months Number of months to include
     * @returns Promise resolving to monthly trends
     */
    static async getMonthlyTrends(userId, months = 12) {
        // Try to get from cache first
        const cacheKey = `${cache_service_1.CACHE_KEYS.ANALYTICS}:${userId}:trends:${months}`;
        const cachedTrends = await cache_service_1.default.get(cacheKey);
        if (cachedTrends) {
            return cachedTrends;
        }
        // If not in cache, get from database
        const trends = await transaction_repository_1.TransactionRepository.getMonthlyTrends(userId, months);
        // Store in cache
        await cache_service_1.default.set(cacheKey, trends, cache_service_1.CACHE_TTL.ANALYTICS);
        return trends;
    }
    /**
     * Invalidate all caches related to a user's transactions and analytics
     * @param userId User ID
     */
    static async invalidateUserCaches(userId) {
        // Invalidate transaction cache
        await cache_service_1.default.invalidateUserTransactions(userId);
        // Invalidate analytics cache
        await cache_service_1.default.invalidateUserAnalytics(userId);
    }
    /**
     * Map Transaction model to TransactionDTO
     * @param transaction Transaction model
     * @param category Optional category data
     * @returns TransactionDTO
     */
    static mapToDTO(transaction, category) {
        return {
            id: transaction.id,
            userId: transaction.userId,
            categoryId: transaction.categoryId,
            amount: transaction.amount,
            description: transaction.description,
            transactionDate: transaction.transactionDate.toISOString().split('T')[0],
            type: transaction.type,
            category,
            createdAt: transaction.createdAt.toISOString()
        };
    }
}
exports.TransactionService = TransactionService;
