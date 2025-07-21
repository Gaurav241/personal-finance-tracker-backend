export interface Transaction {
  id: number;
  userId: number;
  categoryId: number;
  amount: number;
  description: string;
  transactionDate: Date;
  type: 'income' | 'expense';
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionDTO {
  id: number;
  userId: number;
  categoryId: number;
  amount: number;
  description: string;
  transactionDate: Date;
  type: string;
  category?: CategoryDTO;
}

export interface CreateTransactionDTO {
  categoryId: number;
  amount: number;
  description: string;
  transactionDate: Date;
  type: 'income' | 'expense';
}

export interface CategoryDTO {
  id: number;
  name: string;
  type: string;
  color: string;
  icon: string;
}