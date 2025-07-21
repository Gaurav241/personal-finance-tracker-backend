import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';

/**
 * Controller for analytics-related endpoints
 * Implements requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.7
 */
export class AnalyticsController {
  /**
   * Get analytics summary for the authenticated user
   * @route GET /api/v1/analytics/summary
   */
  static async getAnalyticsSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const period = req.query.period as string || 'month';
      
      // Validate period parameter
      const validPeriods = ['month', 'year', 'all', 'lastMonth'];
      if (!validPeriods.includes(period)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid period. Must be one of: month, year, all, lastMonth'
        });
        return;
      }
      
      const summary = await AnalyticsService.getAnalyticsSummary(userId, period);
      
      res.status(200).json({
        status: 'success',
        data: summary
      });
    } catch (error) {
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
  static async getCategoryTrends(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const categoryId = parseInt(req.params.categoryId);
      const months = parseInt(req.query.months as string) || 6;
      
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
      
      const trends = await AnalyticsService.getCategoryTrends(userId, categoryId, months);
      
      res.status(200).json({
        status: 'success',
        data: trends
      });
    } catch (error) {
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
  static async getBudgetComparison(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const period = req.query.period as string || 'month';
      
      // Validate period parameter
      const validPeriods = ['month', 'year'];
      if (!validPeriods.includes(period)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid period. Must be one of: month, year'
        });
        return;
      }
      
      const comparison = await AnalyticsService.getBudgetComparison(userId, period);
      
      res.status(200).json({
        status: 'success',
        data: comparison
      });
    } catch (error) {
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
  static async getFinancialInsights(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const insights = await AnalyticsService.getFinancialInsights(userId);
      
      res.status(200).json({
        status: 'success',
        data: insights
      });
    } catch (error) {
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
  static async getMonthlyTrends(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const months = parseInt(req.query.months as string) || 12;
      
      if (months < 1 || months > 24) {
        res.status(400).json({
          status: 'error',
          message: 'Months must be between 1 and 24'
        });
        return;
      }
      
      // Use the transaction service method directly for monthly trends
      const { TransactionService } = await import('../services/transaction.service');
      const trends = await TransactionService.getMonthlyTrends(userId, months);
      
      res.status(200).json({
        status: 'success',
        data: trends
      });
    } catch (error) {
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
  static async getCategoryBreakdown(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const type = req.params.type as 'income' | 'expense';
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      // Validate type parameter
      if (type !== 'income' && type !== 'expense') {
        res.status(400).json({
          status: 'error',
          message: 'Type must be either "income" or "expense"'
        });
        return;
      }
      
      // Use the transaction service method directly for category breakdown
      const { TransactionService } = await import('../services/transaction.service');
      const breakdown = await TransactionService.getCategoryBreakdown(userId, type, startDate, endDate);
      
      res.status(200).json({
        status: 'success',
        data: breakdown
      });
    } catch (error) {
      console.error('Error getting category breakdown:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve category breakdown'
      });
    }
  }
}