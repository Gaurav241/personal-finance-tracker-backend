import pool from '../db';
import { Category, CreateCategoryDTO, UpdateCategoryDTO } from '../models/category.model';

/**
 * Repository for category-related database operations
 */
export class CategoryRepository {
  /**
   * Get all categories
   * @returns Promise resolving to array of categories
   */
  static async findAll(): Promise<Category[]> {
    const query = 'SELECT * FROM categories ORDER BY name ASC';
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get categories by type (income or expense)
   * @param type Category type
   * @returns Promise resolving to array of categories
   */
  static async findByType(type: 'income' | 'expense'): Promise<Category[]> {
    const query = 'SELECT * FROM categories WHERE type = $1 ORDER BY name ASC';
    const result = await pool.query(query, [type]);
    return result.rows;
  }

  /**
   * Get category by ID
   * @param id Category ID
   * @returns Promise resolving to category or null if not found
   */
  static async findById(id: number): Promise<Category | null> {
    const query = 'SELECT * FROM categories WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
  }

  /**
   * Create a new category
   * @param data Category data
   * @returns Promise resolving to created category
   */
  static async create(data: CreateCategoryDTO): Promise<Category> {
    const query = `
      INSERT INTO categories (name, type, color, icon)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [data.name, data.type, data.color, data.icon];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update an existing category
   * @param id Category ID
   * @param data Category data to update
   * @returns Promise resolving to updated category
   */
  static async update(id: number, data: UpdateCategoryDTO): Promise<Category | null> {
    // Build dynamic query based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }

    if (data.color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      values.push(data.color);
    }

    if (data.icon !== undefined) {
      updates.push(`icon = $${paramIndex++}`);
      values.push(data.icon);
    }

    // If no fields to update, return null
    if (updates.length === 0) {
      return null;
    }

    // Add ID as the last parameter
    values.push(id);

    const query = `
      UPDATE categories
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows.length ? result.rows[0] : null;
  }

  /**
   * Delete a category
   * @param id Category ID
   * @returns Promise resolving to boolean indicating success
   */
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM categories WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
}