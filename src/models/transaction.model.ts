import { CategoryDTO } from './category.model';

/**
 * Transaction model interface
 */
export interface Transaction {
  id: number;
  userId: number;
  categoryId: number | null;
  amount: number;
  description: string;
  transactionDate: Date;
  type: 'income' | 'expense';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transaction Data Transfer Object
 */
export interface TransactionDTO {
  id: number;
  userId: number;
  categoryId: number | null;
  amount: number;
  description: string;
  transactionDate: string;
  type: string;
  category?: CategoryDTO;
  createdAt: string;
}

/**
 * Data required to create a new transaction
 */
export interface CreateTransactionDTO {
  categoryId: number | null;
  amount: number;
  description: string;
  transactionDate: string | Date;
  type: 'income' | 'expense';
}

/**
 * Data required to update an existing transaction
 */
export interface UpdateTransactionDTO {
  categoryId?: number | null;
  amount?: number;
  description?: string;
  transactionDate?: string | Date;
  type?: 'income' | 'expense';
}

/**
 * Transaction filter parameters
 */
export interface TransactionFilterParams {
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense';
  categoryId?: number;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}