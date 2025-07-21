/**
 * This file provides examples of how to use the cache service in controllers
 * It is not meant to be imported or used directly in the application
 */

import { Request, Response } from 'express';
import CacheService, { CACHE_TTL } from '../services/cache.service';

/**
 * Example: Get analytics data with caching
 */
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // Assuming user ID is available from auth middleware
    const period = req.query.period as string || 'month';
    
    // Generate cache key for this specific analytics request
    const cacheKey = CacheService.getAnalyticsKey(userId, period);
    
    // Try to get data from cache first
    const cachedData = await CacheService.get(cacheKey);
    
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
    await CacheService.set(cacheKey, analyticsData, CACHE_TTL.ANALYTICS);
    
    // Return the fresh data
    return res.status(200).json({
      status: 'success',
      data: analyticsData,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics data'
    });
  }
};

/**
 * Example: Update a transaction and invalidate related caches
 */
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const transactionId = parseInt(req.params.id);
    const transactionData = req.body;
    
    // Update transaction in database (example function)
    const updatedTransaction = await updateTransactionInDb(transactionId, transactionData);
    
    // Invalidate all analytics cache for this user (requirement 4.5)
    await CacheService.invalidateUserAnalytics(userId);
    
    // Invalidate transaction cache for this user
    await CacheService.invalidateUserTransactions(userId);
    
    return res.status(200).json({
      status: 'success',
      data: updatedTransaction
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update transaction'
    });
  }
};

/**
 * Example: Get categories with caching
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    // Categories are shared data, so we can use a global cache key
    const cacheKey = CacheService.getCategoriesKey();
    
    // Try to get from cache first
    const cachedCategories = await CacheService.get(cacheKey);
    
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
    await CacheService.set(cacheKey, categories, CACHE_TTL.CATEGORIES);
    
    return res.status(200).json({
      status: 'success',
      data: categories,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch categories'
    });
  }
};

// Mock functions for the examples
async function generateAnalyticsData(userId: number, period: string) {
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

async function updateTransactionInDb(transactionId: number, data: any) {
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