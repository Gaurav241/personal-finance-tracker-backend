import { 
  Transaction, 
  TransactionDTO, 
  CreateTransactionDTO, 
  UpdateTransactionDTO,
  TransactionFilterParams
} from '../models/transaction.model';
import { CategoryDTO } from '../models/category.model';
import { TransactionRepository } from '../repositories/transaction.repository';
import { CategoryService } from './category.service';
import CacheService, { CACHE_TTL, CACHE_KEYS } from './cache.service';

/**
 * Service for transaction-related operations
 */
export class TransactionService {
  /**
   * Get transactions for a user with optional filtering and pagination
   * @param userId User ID
   * @param filters Optional filter parameters
   * @returns Promise resolving to array of transactions and total count
   */
  static async getUserTransactions(
    userId: number, 
    filters: TransactionFilterParams = {}
  ): Promise<{ transactions: TransactionDTO[], total: number }> {
    // Try to get from cache first if no search parameters
    const shouldCache = !filters.search && !filters.minAmount && !filters.maxAmount;
    
    if (shouldCache) {
      const cacheKey = CacheService.getTransactionsKey(userId, filters);
      const cachedData = await CacheService.get<{ transactions: TransactionDTO[], total: number }>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
    }
    
    // If not in cache or shouldn't cache, get from database
    const { transactions, total } = await TransactionRepository.findByUser(userId, filters);
    
    // Get all category IDs from transactions
    const categoryIds = [...new Set(transactions
      .map(t => t.categoryId)
      .filter(id => id !== null) as number[])];
    
    // Get categories for these transactions
    const categoryMap = new Map<number, CategoryDTO>();
    
    if (categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        const category = await CategoryService.getCategoryById(categoryId);
        if (category) {
          categoryMap.set(categoryId, category);
        }
      }
    }
    
    // Map transactions to DTOs with category information
    const transactionDTOs = transactions.map(transaction => 
      this.mapToDTO(transaction, transaction.categoryId ? categoryMap.get(transaction.categoryId) : undefined)
    );
    
    const result = { transactions: transactionDTOs, total };
    
    // Store in cache if appropriate
    if (shouldCache) {
      const cacheKey = CacheService.getTransactionsKey(userId, filters);
      await CacheService.set(cacheKey, result, CACHE_TTL.TRANSACTIONS);
    }
    
    return result;
  }

  /**
   * Get a transaction by ID
   * @param id Transaction ID
   * @param userId User ID for authorization
   * @returns Promise resolving to transaction or null if not found
   */
  static async getTransactionById(id: number, userId: number): Promise<TransactionDTO | null> {
    const transaction = await TransactionRepository.findById(id, userId);
    
    if (!transaction) {
      return null;
    }
    
    let category: CategoryDTO | undefined;
    
    if (transaction.categoryId) {
      const categoryResult = await CategoryService.getCategoryById(transaction.categoryId);
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
  static async createTransaction(userId: number, data: CreateTransactionDTO): Promise<TransactionDTO> {
    const transaction = await TransactionRepository.create(userId, data);
    
    // Invalidate caches
    await this.invalidateUserCaches(userId);
    
    let category: CategoryDTO | undefined;
    
    if (transaction.categoryId) {
      const categoryResult = await CategoryService.getCategoryById(transaction.categoryId);
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
  static async updateTransaction(
    id: number, 
    userId: number, 
    data: UpdateTransactionDTO
  ): Promise<TransactionDTO | null> {
    const transaction = await TransactionRepository.update(id, userId, data);
    
    if (!transaction) {
      return null;
    }
    
    // Invalidate caches
    await this.invalidateUserCaches(userId);
    
    let category: CategoryDTO | undefined;
    
    if (transaction.categoryId) {
      const categoryResult = await CategoryService.getCategoryById(transaction.categoryId);
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
  static async deleteTransaction(id: number, userId: number): Promise<boolean> {
    const result = await TransactionRepository.delete(id, userId);
    
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
  static async getTransactionStatistics(
    userId: number, 
    startDate?: string, 
    endDate?: string
  ): Promise<{
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
    transactionCount: number;
  }> {
    // Try to get from cache first
    const cacheKey = `${CACHE_KEYS.ANALYTICS}:${userId}:stats:${startDate || 'all'}:${endDate || 'all'}`;
    const cachedStats = await CacheService.get<{
      totalIncome: number;
      totalExpense: number;
      netIncome: number;
      transactionCount: number;
    }>(cacheKey);
    
    if (cachedStats) {
      return cachedStats;
    }
    
    // If not in cache, get from database
    const stats = await TransactionRepository.getStatistics(userId, startDate, endDate);
    
    // Store in cache
    await CacheService.set(cacheKey, stats, CACHE_TTL.ANALYTICS);
    
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
  static async getCategoryBreakdown(
    userId: number,
    type: 'income' | 'expense',
    startDate?: string,
    endDate?: string
  ): Promise<Array<{
    categoryId: number | null;
    categoryName: string | null;
    categoryColor: string | null;
    categoryIcon: string | null;
    amount: number;
    percentage: number;
  }>> {
    // Try to get from cache first
    const cacheKey = `${CACHE_KEYS.ANALYTICS}:${userId}:breakdown:${type}:${startDate || 'all'}:${endDate || 'all'}`;
    const cachedBreakdown = await CacheService.get<Array<{
      categoryId: number | null;
      categoryName: string | null;
      categoryColor: string | null;
      categoryIcon: string | null;
      amount: number;
      percentage: number;
    }>>(cacheKey);
    
    if (cachedBreakdown) {
      return cachedBreakdown;
    }
    
    // If not in cache, get from database
    const breakdown = await TransactionRepository.getCategoryBreakdown(userId, type, startDate, endDate);
    
    // Store in cache
    await CacheService.set(cacheKey, breakdown, CACHE_TTL.ANALYTICS);
    
    return breakdown;
  }

  /**
   * Get monthly trends for a user's transactions
   * @param userId User ID
   * @param months Number of months to include
   * @returns Promise resolving to monthly trends
   */
  static async getMonthlyTrends(
    userId: number,
    months: number = 12
  ): Promise<Array<{
    month: string;
    income: number;
    expense: number;
    netIncome: number;
  }>> {
    // Try to get from cache first
    const cacheKey = `${CACHE_KEYS.ANALYTICS}:${userId}:trends:${months}`;
    const cachedTrends = await CacheService.get<Array<{
      month: string;
      income: number;
      expense: number;
      netIncome: number;
    }>>(cacheKey);
    
    if (cachedTrends) {
      return cachedTrends;
    }
    
    // If not in cache, get from database
    const trends = await TransactionRepository.getMonthlyTrends(userId, months);
    
    // Store in cache
    await CacheService.set(cacheKey, trends, CACHE_TTL.ANALYTICS);
    
    return trends;
  }

  /**
   * Invalidate all caches related to a user's transactions and analytics
   * @param userId User ID
   */
  private static async invalidateUserCaches(userId: number): Promise<void> {
    // Invalidate transaction cache
    await CacheService.invalidateUserTransactions(userId);
    
    // Invalidate analytics cache
    await CacheService.invalidateUserAnalytics(userId);
  }

  /**
   * Map Transaction model to TransactionDTO
   * @param transaction Transaction model
   * @param category Optional category data
   * @returns TransactionDTO
   */
  private static mapToDTO(transaction: Transaction, category?: CategoryDTO): TransactionDTO {
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