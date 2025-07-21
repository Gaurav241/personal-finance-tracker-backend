import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { CreateTransactionDTO, UpdateTransactionDTO, TransactionFilterParams } from '../models/transaction.model';

/**
 * Controller for transaction-related endpoints
 */
export class TransactionController {
  /**
   * Get transactions for the authenticated user with optional filtering and pagination
   * Implements requirements:
   * - 2.4: "WHEN user searches transactions THEN the system SHALL return filtered results based on search criteria"
   * - 2.5: "WHEN user filters by category THEN the system SHALL display only transactions matching selected categories"
   * - 2.7: "WHEN transaction list exceeds page limit THEN the system SHALL implement pagination for performance"
   * - 6.3: "WHEN 'user' role accesses transaction endpoints THEN the system SHALL filter data to show only their own records"
   */
  static async getUserTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      // Extract filter parameters from query string
      const filters: TransactionFilterParams = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        type: req.query.type as 'income' | 'expense' | undefined,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined
      };
      
      const result = await TransactionService.getUserTransactions(userId, filters);
      
      res.status(200).json({
        status: 'success',
        data: result.transactions,
        pagination: {
          total: result.total,
          page: filters.page || 1,
          limit: filters.limit || 10,
          pages: Math.ceil(result.total / (filters.limit || 10))
        }
      });
    } catch (error) {
      console.error('Error getting user transactions:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve transactions'
      });
    }
  }

  /**
   * Get a specific transaction by ID
   * Implements requirement 6.3: "WHEN 'user' role accesses transaction endpoints THEN the system SHALL filter data to show only their own records"
   */
  static async getTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const transactionId = parseInt(req.params.id);
      
      if (isNaN(transactionId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid transaction ID'
        });
        return;
      }
      
      const transaction = await TransactionService.getTransactionById(transactionId, userId);
      
      if (!transaction) {
        res.status(404).json({
          status: 'error',
          message: 'Transaction not found'
        });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        data: transaction
      });
    } catch (error) {
      console.error('Error getting transaction by ID:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve transaction'
      });
    }
  }

  /**
   * Create a new transaction
   * Implements requirement 2.1: "WHEN user with 'admin' or 'user' role creates a transaction THEN the system SHALL save it with category, amount, date, and description"
   */
  static async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const transactionData: CreateTransactionDTO = {
        categoryId: req.body.categoryId,
        amount: req.body.amount,
        description: req.body.description,
        transactionDate: req.body.transactionDate,
        type: req.body.type
      };
      
      // Validate required fields
      if (!transactionData.amount || !transactionData.transactionDate || !transactionData.type) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required fields: amount, transactionDate, and type are required'
        });
        return;
      }
      
      // Validate transaction type
      if (transactionData.type !== 'income' && transactionData.type !== 'expense') {
        res.status(400).json({
          status: 'error',
          message: 'Transaction type must be either "income" or "expense"'
        });
        return;
      }
      
      const transaction = await TransactionService.createTransaction(userId, transactionData);
      
      res.status(201).json({
        status: 'success',
        data: transaction
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create transaction'
      });
    }
  }

  /**
   * Update an existing transaction
   * Implements requirement 2.2: "WHEN user with 'admin' or 'user' role edits a transaction THEN the system SHALL update the record and invalidate related cache"
   */
  static async updateTransaction(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const transactionId = parseInt(req.params.id);
      
      if (isNaN(transactionId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid transaction ID'
        });
        return;
      }
      
      const transactionData: UpdateTransactionDTO = {
        categoryId: req.body.categoryId,
        amount: req.body.amount,
        description: req.body.description,
        transactionDate: req.body.transactionDate,
        type: req.body.type
      };
      
      // Validate transaction type if provided
      if (transactionData.type && transactionData.type !== 'income' && transactionData.type !== 'expense') {
        res.status(400).json({
          status: 'error',
          message: 'Transaction type must be either "income" or "expense"'
        });
        return;
      }
      
      const transaction = await TransactionService.updateTransaction(transactionId, userId, transactionData);
      
      if (!transaction) {
        res.status(404).json({
          status: 'error',
          message: 'Transaction not found or you do not have permission to update it'
        });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        data: transaction
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update transaction'
      });
    }
  }

  /**
   * Delete a transaction
   * Implements requirement 2.3: "WHEN user with 'admin' or 'user' role deletes a transaction THEN the system SHALL remove it from database and update analytics"
   */
  static async deleteTransaction(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const transactionId = parseInt(req.params.id);
      
      if (isNaN(transactionId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid transaction ID'
        });
        return;
      }
      
      const success = await TransactionService.deleteTransaction(transactionId, userId);
      
      if (!success) {
        res.status(404).json({
          status: 'error',
          message: 'Transaction not found or you do not have permission to delete it'
        });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete transaction'
      });
    }
  }
}

export default TransactionController;