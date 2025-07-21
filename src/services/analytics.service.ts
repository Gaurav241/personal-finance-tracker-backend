import { TransactionService } from './transaction.service';
import CacheService, { CACHE_TTL, CACHE_KEYS } from './cache.service';

/**
 * Analytics service for generating financial insights and reports
 * Implements requirements 3.1, 3.2, 3.3, 3.6, 4.3, 4.5
 */
export class AnalyticsService {
  /**
   * Get comprehensive analytics summary for a user
   * @param userId User ID
   * @param period Time period (month, year, all)
   * @returns Promise resolving to analytics summary
   */
  static async getAnalyticsSummary(
    userId: number,
    period: string = 'month'
  ): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
    categoryBreakdown: Array<{
      categoryId: number | null;
      categoryName: string;
      amount: number;
      percentage: number;
      color: string;
    }>;
    monthlyTrends: Array<{
      month: string;
      income: number;
      expense: number;
      netIncome: number;
    }>;
  }> {
    // Try to get from cache first
    const cacheKey = CacheService.getAnalyticsKey(userId, period);
    const cachedData = await CacheService.get<any>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // Calculate date range based on period
    const { startDate, endDate } = this.getDateRange(period);
    
    // Get basic statistics
    const stats = await TransactionService.getTransactionStatistics(userId, startDate, endDate);
    
    // Get category breakdown for expenses
    const expenseBreakdown = await TransactionService.getCategoryBreakdown(
      userId, 
      'expense', 
      startDate, 
      endDate
    );
    
    // Get category breakdown for income
    const incomeBreakdown = await TransactionService.getCategoryBreakdown(
      userId, 
      'income', 
      startDate, 
      endDate
    );
    
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
    const monthlyTrends = await TransactionService.getMonthlyTrends(userId, 12);
    
    const result = {
      totalIncome: stats.totalIncome,
      totalExpenses: stats.totalExpense,
      netIncome: stats.netIncome,
      transactionCount: stats.transactionCount,
      categoryBreakdown,
      monthlyTrends
    };
    
    // Cache the result
    await CacheService.set(cacheKey, result, CACHE_TTL.ANALYTICS);
    
    return result;
  }
  
  /**
   * Get spending trends by category over time
   * @param userId User ID
   * @param categoryId Category ID
   * @param months Number of months to analyze
   * @returns Promise resolving to spending trends
   */
  static async getCategoryTrends(
    userId: number,
    categoryId: number,
    months: number = 6
  ): Promise<Array<{
    month: string;
    amount: number;
    transactionCount: number;
  }>> {
    // Try to get from cache first
    const cacheKey = `${CACHE_KEYS.ANALYTICS}:${userId}:category_trends:${categoryId}:${months}`;
    const cachedData = await CacheService.get<Array<{
      month: string;
      amount: number;
      transactionCount: number;
    }>>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // This would typically involve a more complex database query
    // For now, we'll use the existing transaction service methods
    const trends = await TransactionService.getMonthlyTrends(userId, months);
    
    // Filter and transform for specific category (simplified implementation)
    const categoryTrends = trends.map(trend => ({
      month: trend.month,
      amount: trend.expense, // Simplified - would need category-specific filtering
      transactionCount: 0 // Would need to be calculated from actual data
    }));
    
    // Cache the result
    await CacheService.set(cacheKey, categoryTrends, CACHE_TTL.ANALYTICS);
    
    return categoryTrends;
  }
  
  /**
   * Get budget vs actual spending comparison
   * @param userId User ID
   * @param period Time period
   * @returns Promise resolving to budget comparison
   */
  static async getBudgetComparison(
    userId: number,
    period: string = 'month'
  ): Promise<{
    totalBudget: number;
    totalSpent: number;
    remainingBudget: number;
    categories: Array<{
      categoryId: number;
      categoryName: string;
      budgetAmount: number;
      spentAmount: number;
      remainingAmount: number;
      percentageUsed: number;
    }>;
  }> {
    // Try to get from cache first
    const cacheKey = `${CACHE_KEYS.ANALYTICS}:${userId}:budget:${period}`;
    const cachedData = await CacheService.get<any>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    const { startDate, endDate } = this.getDateRange(period);
    
    // Get actual spending
    const stats = await TransactionService.getTransactionStatistics(userId, startDate, endDate);
    const categoryBreakdown = await TransactionService.getCategoryBreakdown(
      userId, 
      'expense', 
      startDate, 
      endDate
    );
    
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
    await CacheService.set(cacheKey, result, CACHE_TTL.ANALYTICS);
    
    return result;
  }
  
  /**
   * Get financial insights and recommendations
   * @param userId User ID
   * @returns Promise resolving to insights
   */
  static async getFinancialInsights(userId: number): Promise<{
    insights: Array<{
      type: 'warning' | 'info' | 'success';
      title: string;
      message: string;
      action?: string;
    }>;
    recommendations: Array<{
      category: string;
      suggestion: string;
      potentialSavings: number;
    }>;
  }> {
    // Try to get from cache first
    const cacheKey = `${CACHE_KEYS.ANALYTICS}:${userId}:insights`;
    const cachedData = await CacheService.get<any>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    const currentMonth = this.getDateRange('month');
    const lastMonth = this.getDateRange('lastMonth');
    
    // Get current and previous month stats
    const currentStats = await TransactionService.getTransactionStatistics(
      userId, 
      currentMonth.startDate, 
      currentMonth.endDate
    );
    
    const lastStats = await TransactionService.getTransactionStatistics(
      userId, 
      lastMonth.startDate, 
      lastMonth.endDate
    );
    
    const insights = [];
    const recommendations = [];
    
    // Generate insights based on spending patterns
    if (currentStats.totalExpense > lastStats.totalExpense) {
      const increase = ((currentStats.totalExpense - lastStats.totalExpense) / lastStats.totalExpense) * 100;
      insights.push({
        type: 'warning' as const,
        title: 'Increased Spending',
        message: `Your spending increased by ${increase.toFixed(1)}% compared to last month.`,
        action: 'Review your recent transactions'
      });
    }
    
    if (currentStats.netIncome < 0) {
      insights.push({
        type: 'warning' as const,
        title: 'Negative Cash Flow',
        message: 'You spent more than you earned this month.',
        action: 'Consider reducing expenses or increasing income'
      });
    } else {
      insights.push({
        type: 'success' as const,
        title: 'Positive Cash Flow',
        message: `You saved $${currentStats.netIncome.toFixed(2)} this month.`
      });
    }
    
    // Get category breakdown for recommendations
    const categoryBreakdown = await TransactionService.getCategoryBreakdown(
      userId, 
      'expense', 
      currentMonth.startDate, 
      currentMonth.endDate
    );
    
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
    await CacheService.set(cacheKey, result, CACHE_TTL.DEFAULT);
    
    return result;
  }
  
  /**
   * Invalidate analytics cache when transactions are updated
   * Implements requirement 4.5
   * @param userId User ID
   */
  static async invalidateAnalyticsCache(userId: number): Promise<void> {
    await CacheService.invalidateUserAnalytics(userId);
  }
  
  /**
   * Get date range based on period
   * @param period Time period (month, year, lastMonth, all)
   * @returns Start and end dates
   */
  private static getDateRange(period: string): { startDate?: string; endDate?: string } {
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