import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../models/category.model';

/**
 * Controller for category-related endpoints
 */
export class CategoryController {
  /**
   * Get all categories
   * @route GET /api/v1/categories
   */
  static async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await CategoryService.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  }

  /**
   * Get categories by type
   * @route GET /api/v1/categories/type/:type
   */
  static async getCategoriesByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      
      // Validate type parameter
      if (type !== 'income' && type !== 'expense') {
        res.status(400).json({ message: 'Invalid category type. Must be "income" or "expense"' });
        return;
      }
      
      const categories = await CategoryService.getCategoriesByType(type as 'income' | 'expense');
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories by type:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  }

  /**
   * Get category by ID
   * @route GET /api/v1/categories/:id
   */
  static async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid category ID' });
        return;
      }
      
      const category = await CategoryService.getCategoryById(id);
      
      if (!category) {
        res.status(404).json({ message: 'Category not found' });
        return;
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ message: 'Failed to fetch category' });
    }
  }

  /**
   * Create a new category (admin only)
   * @route POST /api/v1/categories
   */
  static async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const { name, type, color, icon } = req.body;
      
      // Validate required fields
      if (!name || !type) {
        res.status(400).json({ message: 'Name and type are required' });
        return;
      }
      
      // Validate type
      if (type !== 'income' && type !== 'expense') {
        res.status(400).json({ message: 'Type must be "income" or "expense"' });
        return;
      }
      
      const categoryData: CreateCategoryDTO = {
        name,
        type: type as 'income' | 'expense',
        color: color || '#CCCCCC', // Default color if not provided
        icon: icon || 'default' // Default icon if not provided
      };
      
      const newCategory = await CategoryService.createCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Failed to create category' });
    }
  }

  /**
   * Update an existing category (admin only)
   * @route PUT /api/v1/categories/:id
   */
  static async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid category ID' });
        return;
      }
      
      const { name, color, icon } = req.body;
      
      // Ensure at least one field is provided
      if (!name && !color && !icon) {
        res.status(400).json({ message: 'At least one field (name, color, or icon) must be provided' });
        return;
      }
      
      const updateData: UpdateCategoryDTO = {};
      
      if (name !== undefined) updateData.name = name;
      if (color !== undefined) updateData.color = color;
      if (icon !== undefined) updateData.icon = icon;
      
      const updatedCategory = await CategoryService.updateCategory(id, updateData);
      
      if (!updatedCategory) {
        res.status(404).json({ message: 'Category not found' });
        return;
      }
      
      res.json(updatedCategory);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Failed to update category' });
    }
  }

  /**
   * Delete a category (admin only)
   * @route DELETE /api/v1/categories/:id
   */
  static async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid category ID' });
        return;
      }
      
      const result = await CategoryService.deleteCategory(id);
      
      if (!result) {
        res.status(404).json({ message: 'Category not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Failed to delete category' });
    }
  }
}