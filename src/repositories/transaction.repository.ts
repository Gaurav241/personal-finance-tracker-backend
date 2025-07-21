import pool from '../db';
import { 
  Transaction, 
  CreateTransactionDTO, 
  UpdateTransactionDTO,
  TransactionFilterParams
} from '../models/transaction.model';

/**
 * Repository for transaction-related database operations
 */
export class TransactionRepository {
  /**
   * Find all transactions for a user with optional filtering and pagination
   * @param userId User ID
   * @param filters Optional filter parameters
   * @returns Promise resolving to array of transactions and total count
   */
  static async findByUser(
    userId: number, 
    filters: TransactionFilterParams = {}
  ): Promise<{ transactions: Transaction[], total: number }> {
    // Build WHERE clause based on filters
    const conditions: string[] = ['user_id = $1'];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (filters.startDate) {
      conditions.push(`transaction_date >= $${paramIndex++}`);
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`transaction_date <= $${paramIndex++}`);
      values.push(filters.endDate);
    }

    if (filters.type) {
      conditions.push(`type = $${paramIndex++}`);
      values.push(filters.type);
    }

    if (filters.categoryId) {
      conditions.push(`category_id = $${paramIndex++}`);
      values.push(filters.categoryId);
    }

    if (filters.minAmount !== undefined) {
      conditions.push(`amount >= $${paramIndex++}`);
      values.push(filters.minAmount);
    }

    if (filters.maxAmount !== undefined) {
      conditions.push(`amount <= $${paramIndex++}`);
      values.push(filters.maxAmount);
    }

    if (filters.search) {
      conditions.push(`description ILIKE $${paramIndex++}`);
      values.push(`%${filters.search}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);

    // Build sorting and pagination
    const sortBy = filters.sortBy || 'transaction_date';
    const sortOrder = filters.sortOrder || 'desc';
    const limit = filters.limit || 10;
    const offset = filters.page ? (filters.page - 1) * limit : 0;

    // Get paginated results
    const query = `
      SELECT t.*, c.name as category_name, c.type as category_type, c.color as category_color, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    
    return {
      transactions: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        categoryId: row.category_id,
        amount: parseFloat(row.amount),
        description: row.description,
        transactionDate: row.transaction_date,
        type: row.type,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      total
    };
  }

  /**
   * Find a transaction by ID
   * @param id Transaction ID
   * @param userId Optional user ID for authorization
   * @returns Promise resolving to transaction or null if not found
   */
  static async findById(id: number, userId?: number): Promise<Transaction | null> {
    const query = `
      SELECT t.*, c.name as category_name, c.type as category_type, c.color as category_color, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = $1 ${userId ? 'AND t.user_id = $2' : ''}
    `;
    
    const values = userId ? [id, userId] : [id];
    const result = await pool.query(query, values);
    
    if (!result.rows.length) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      categoryId: row.category_id,
      amount: parseFloat(row.amount),
      description: row.description,
      transactionDate: row.transaction_date,
      type: row.type,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Create a new transaction
   * @param userId User ID
   * @param data Transaction data
   * @returns Promise resolving to created transaction
   */
  static async create(userId: number, data: CreateTransactionDTO): Promise<Transaction> {
    const query = `
      INSERT INTO transactions (user_id, category_id, amount, description, transaction_date, type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      userId,
      data.categoryId,
      data.amount,
      data.description,
      data.transactionDate,
      data.type
    ];
    
    const result = await pool.query(query, values);
    const row = result.rows[0];
    
    return {
      id: row.id,
      userId: row.user_id,
      categoryId: row.category_id,
      amount: parseFloat(row.amount),
      description: row.description,
      transactionDate: row.transaction_date,
      type: row.type,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Update an existing transaction
   * @param id Transaction ID
   * @param userId User ID for authorization
   * @param data Transaction data to update
   * @returns Promise resolving to updated transaction or null if not found
   */
  static async update(
    id: number, 
    userId: number, 
    data: UpdateTransactionDTO
  ): Promise<Transaction | null> {
    // Build dynamic query based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.categoryId !== undefined) {
      updates.push(`category_id = $${paramIndex++}`);
      values.push(data.categoryId);
    }

    if (data.amount !== undefined) {
      updates.push(`amount = $${paramIndex++}`);
      values.push(data.amount);
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }

    if (data.transactionDate !== undefined) {
      updates.push(`transaction_date = $${paramIndex++}`);
      values.push(data.transactionDate);
    }

    if (data.type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      values.push(data.type);
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = NOW()`);

    // If no fields to update, return null
    if (updates.length === 0) {
      return null;
    }

    // Add ID and userId as the last parameters
    values.push(id, userId);

    const query = `
      UPDATE transactions
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    
    if (!result.rows.length) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      categoryId: row.category_id,
      amount: parseFloat(row.amount),
      description: row.description,
      transactionDate: row.transaction_date,
      type: row.type,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Delete a transaction
   * @param id Transaction ID
   * @param userId User ID for authorization
   * @returns Promise resolving to boolean indicating success
   */
  static async delete(id: number, userId: number): Promise<boolean> {
    const query = 'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await pool.query(query, [id, userId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get transaction statistics for a user
   * @param userId User ID
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   * @returns Promise resolving to transaction statistics
   */
  static async getStatistics(
    userId: number, 
    startDate?: string, 
    endDate?: string
  ): Promise<{
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
    transactionCount: number;
  }> {
    const conditions: string[] = ['user_id = $1'];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (startDate) {
      conditions.push(`transaction_date >= $${paramIndex++}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`transaction_date <= $${paramIndex++}`);
      values.push(endDate);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COUNT(*) as transaction_count
      FROM transactions
      ${whereClause}
    `;

    const result = await pool.query(query, values);
    const row = result.rows[0];
    
    const totalIncome = parseFloat(row.total_income);
    const totalExpense = parseFloat(row.total_expense);
    
    return {
      totalIncome,
      totalExpense,
      netIncome: totalIncome - totalExpense,
      transactionCount: parseInt(row.transaction_count, 10)
    };
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
    const conditions: string[] = ['t.user_id = $1', 't.type = $2'];
    const values: any[] = [userId, type];
    let paramIndex = 3;

    if (startDate) {
      conditions.push(`t.transaction_date >= $${paramIndex++}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`t.transaction_date <= $${paramIndex++}`);
      values.push(endDate);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      WITH total AS (
        SELECT COALESCE(SUM(amount), 0) as total_amount
        FROM transactions
        WHERE user_id = $1 AND type = $2
        ${startDate ? 'AND transaction_date >= $' + (paramIndex - 2) : ''}
        ${endDate ? 'AND transaction_date <= $' + (paramIndex - 1) : ''}
      )
      SELECT
        t.category_id,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        SUM(t.amount) as amount,
        (SUM(t.amount) / (SELECT total_amount FROM total)) * 100 as percentage
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
      GROUP BY t.category_id, c.name, c.color, c.icon
      ORDER BY amount DESC
    `;

    const result = await pool.query(query, values);
    
    return result.rows.map(row => ({
      categoryId: row.category_id,
      categoryName: row.category_name || 'Uncategorized',
      categoryColor: row.category_color || '#CCCCCC',
      categoryIcon: row.category_icon || 'help_outline',
      amount: parseFloat(row.amount),
      percentage: parseFloat(row.percentage)
    }));
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
    const query = `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE) - interval '${months - 1} month',
          date_trunc('month', CURRENT_DATE),
          interval '1 month'
        )::date as month_start
      ),
      monthly_data AS (
        SELECT
          date_trunc('month', transaction_date)::date as month_start,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM transactions
        WHERE user_id = $1
          AND transaction_date >= (CURRENT_DATE - interval '${months} month')
        GROUP BY month_start
      )
      SELECT
        to_char(m.month_start, 'YYYY-MM') as month,
        COALESCE(md.income, 0) as income,
        COALESCE(md.expense, 0) as expense,
        COALESCE(md.income, 0) - COALESCE(md.expense, 0) as net_income
      FROM months m
      LEFT JOIN monthly_data md ON m.month_start = md.month_start
      ORDER BY m.month_start ASC
    `;

    const result = await pool.query(query, [userId]);
    
    return result.rows.map(row => ({
      month: row.month,
      income: parseFloat(row.income),
      expense: parseFloat(row.expense),
      netIncome: parseFloat(row.net_income)
    }));
  }
}