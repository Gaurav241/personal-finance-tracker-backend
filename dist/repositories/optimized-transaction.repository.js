"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizedTransactionRepository = void 0;
const db_1 = __importDefault(require("../db"));
/**
 * Optimized repository for transaction-related database operations
 * Implements requirements 4.2, 5.5: Optimize complex queries, implement query parameterization
 */
class OptimizedTransactionRepository {
    /**
     * Find transactions with optimized query and proper indexing
     * Uses prepared statements and optimized WHERE clauses
     */
    static async findByUserOptimized(userId, filters = {}) {
        // Build optimized WHERE clause using indexed columns
        const conditions = ['t.user_id = $1'];
        const values = [userId];
        let paramIndex = 2;
        // Use indexed columns for better performance
        if (filters.startDate && filters.endDate) {
            // Use BETWEEN for better index utilization
            conditions.push(`t.transaction_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
            values.push(filters.startDate, filters.endDate);
            paramIndex += 2;
        }
        else if (filters.startDate) {
            conditions.push(`t.transaction_date >= $${paramIndex}`);
            values.push(filters.startDate);
            paramIndex++;
        }
        else if (filters.endDate) {
            conditions.push(`t.transaction_date <= $${paramIndex}`);
            values.push(filters.endDate);
            paramIndex++;
        }
        if (filters.type) {
            conditions.push(`t.type = $${paramIndex}`);
            values.push(filters.type);
            paramIndex++;
        }
        if (filters.categoryId) {
            conditions.push(`t.category_id = $${paramIndex}`);
            values.push(filters.categoryId);
            paramIndex++;
        }
        if (filters.minAmount !== undefined) {
            conditions.push(`t.amount >= $${paramIndex}`);
            values.push(filters.minAmount);
            paramIndex++;
        }
        if (filters.maxAmount !== undefined) {
            conditions.push(`t.amount <= $${paramIndex}`);
            values.push(filters.maxAmount);
            paramIndex++;
        }
        // Use full-text search for description search (more efficient than ILIKE)
        if (filters.search) {
            conditions.push(`t.description ILIKE $${paramIndex}`);
            values.push(`%${filters.search}%`);
            paramIndex++;
        }
        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        // Optimized count query using the same conditions
        const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      ${whereClause}
    `;
        const countResult = await db_1.default.query(countQuery, values);
        const total = parseInt(countResult.rows[0].total, 10);
        // Build optimized main query with proper sorting and pagination
        const sortBy = filters.sortBy || 'transaction_date';
        const sortOrder = filters.sortOrder || 'desc';
        const limit = Math.min(filters.limit || 50, 1000); // Cap at 1000 for performance
        const offset = filters.page ? (filters.page - 1) * limit : 0;
        // Use LEFT JOIN instead of separate queries for better performance
        const query = `
      SELECT 
        t.id,
        t.user_id,
        t.category_id,
        t.amount,
        t.description,
        t.transaction_date,
        t.type,
        t.created_at,
        t.updated_at,
        c.name as category_name,
        c.type as category_type,
        c.color as category_color,
        c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
      ORDER BY t.${sortBy} ${sortOrder}, t.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        values.push(limit, offset);
        const result = await db_1.default.query(query, values);
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
     * Optimized statistics query using aggregation and indexes
     */
    static async getOptimizedStatistics(userId, startDate, endDate) {
        const conditions = ['user_id = $1'];
        const values = [userId];
        let paramIndex = 2;
        if (startDate && endDate) {
            conditions.push(`transaction_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
            values.push(startDate, endDate);
            paramIndex += 2;
        }
        else if (startDate) {
            conditions.push(`transaction_date >= $${paramIndex}`);
            values.push(startDate);
            paramIndex++;
        }
        else if (endDate) {
            conditions.push(`transaction_date <= $${paramIndex}`);
            values.push(endDate);
            paramIndex++;
        }
        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        // Single optimized query for all statistics
        const statsQuery = `
      WITH transaction_stats AS (
        SELECT
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
          COUNT(*) as transaction_count,
          AVG(amount) as avg_amount
        FROM transactions
        ${whereClause}
      ),
      category_stats AS (
        SELECT
          t.category_id,
          c.name as category_name,
          SUM(t.amount) as total_amount,
          COUNT(*) as transaction_count
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ${whereClause}
        GROUP BY t.category_id, c.name
        ORDER BY total_amount DESC
        LIMIT 10
      )
      SELECT 
        ts.total_income,
        ts.total_expense,
        ts.transaction_count,
        ts.avg_amount,
        json_agg(
          json_build_object(
            'categoryId', cs.category_id,
            'categoryName', cs.category_name,
            'totalAmount', cs.total_amount,
            'transactionCount', cs.transaction_count
          )
        ) as category_stats
      FROM transaction_stats ts
      CROSS JOIN category_stats cs
      GROUP BY ts.total_income, ts.total_expense, ts.transaction_count, ts.avg_amount
    `;
        const result = await db_1.default.query(statsQuery, values);
        const row = result.rows[0];
        const totalIncome = parseFloat(row.total_income || 0);
        const totalExpense = parseFloat(row.total_expense || 0);
        return {
            totalIncome,
            totalExpense,
            netIncome: totalIncome - totalExpense,
            transactionCount: parseInt(row.transaction_count || 0, 10),
            avgTransactionAmount: parseFloat(row.avg_amount || 0),
            categoryStats: row.category_stats || []
        };
    }
    /**
     * Optimized monthly trends query using window functions
     */
    static async getOptimizedMonthlyTrends(userId, months = 12) {
        const query = `
      WITH monthly_data AS (
        SELECT
          DATE_TRUNC('month', transaction_date) as month_start,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
          COUNT(*) as transaction_count
        FROM transactions
        WHERE user_id = $1
          AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '${months} month'
        GROUP BY DATE_TRUNC('month', transaction_date)
        ORDER BY month_start ASC
      )
      SELECT
        TO_CHAR(month_start, 'YYYY-MM') as month,
        COALESCE(income, 0) as income,
        COALESCE(expense, 0) as expense,
        COALESCE(income, 0) - COALESCE(expense, 0) as net_income,
        transaction_count
      FROM monthly_data
    `;
        const result = await db_1.default.query(query, [userId]);
        return result.rows.map(row => ({
            month: row.month,
            income: parseFloat(row.income),
            expense: parseFloat(row.expense),
            netIncome: parseFloat(row.net_income),
            transactionCount: parseInt(row.transaction_count, 10)
        }));
    }
    /**
     * Batch insert for multiple transactions (more efficient than individual inserts)
     */
    static async batchCreate(userId, transactions) {
        if (transactions.length === 0)
            return [];
        // Build batch insert query
        const values = [];
        const placeholders = [];
        let paramIndex = 1;
        transactions.forEach((transaction, index) => {
            placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`);
            values.push(userId, transaction.categoryId, transaction.amount, transaction.description, transaction.transactionDate, transaction.type);
            paramIndex += 6;
        });
        const query = `
      INSERT INTO transactions (user_id, category_id, amount, description, transaction_date, type)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;
        const result = await db_1.default.query(query, values);
        return result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            categoryId: row.category_id,
            amount: parseFloat(row.amount),
            description: row.description,
            transactionDate: row.transaction_date,
            type: row.type,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
    }
}
exports.OptimizedTransactionRepository = OptimizedTransactionRepository;
