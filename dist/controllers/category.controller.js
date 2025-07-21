"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const category_service_1 = require("../services/category.service");
/**
 * Controller for category-related endpoints
 */
class CategoryController {
    /**
     * Get all categories
     * @route GET /api/v1/categories
     */
    static async getAllCategories(req, res) {
        try {
            const categories = await category_service_1.CategoryService.getAllCategories();
            res.json(categories);
        }
        catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ message: 'Failed to fetch categories' });
        }
    }
    /**
     * Get categories by type
     * @route GET /api/v1/categories/type/:type
     */
    static async getCategoriesByType(req, res) {
        try {
            const { type } = req.params;
            // Validate type parameter
            if (type !== 'income' && type !== 'expense') {
                res.status(400).json({ message: 'Invalid category type. Must be "income" or "expense"' });
                return;
            }
            const categories = await category_service_1.CategoryService.getCategoriesByType(type);
            res.json(categories);
        }
        catch (error) {
            console.error('Error fetching categories by type:', error);
            res.status(500).json({ message: 'Failed to fetch categories' });
        }
    }
    /**
     * Get category by ID
     * @route GET /api/v1/categories/:id
     */
    static async getCategoryById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ message: 'Invalid category ID' });
                return;
            }
            const category = await category_service_1.CategoryService.getCategoryById(id);
            if (!category) {
                res.status(404).json({ message: 'Category not found' });
                return;
            }
            res.json(category);
        }
        catch (error) {
            console.error('Error fetching category:', error);
            res.status(500).json({ message: 'Failed to fetch category' });
        }
    }
    /**
     * Create a new category (admin only)
     * @route POST /api/v1/categories
     */
    static async createCategory(req, res) {
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
            const categoryData = {
                name,
                type: type,
                color: color || '#CCCCCC', // Default color if not provided
                icon: icon || 'default' // Default icon if not provided
            };
            const newCategory = await category_service_1.CategoryService.createCategory(categoryData);
            res.status(201).json(newCategory);
        }
        catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({ message: 'Failed to create category' });
        }
    }
    /**
     * Update an existing category (admin only)
     * @route PUT /api/v1/categories/:id
     */
    static async updateCategory(req, res) {
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
            const updateData = {};
            if (name !== undefined)
                updateData.name = name;
            if (color !== undefined)
                updateData.color = color;
            if (icon !== undefined)
                updateData.icon = icon;
            const updatedCategory = await category_service_1.CategoryService.updateCategory(id, updateData);
            if (!updatedCategory) {
                res.status(404).json({ message: 'Category not found' });
                return;
            }
            res.json(updatedCategory);
        }
        catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ message: 'Failed to update category' });
        }
    }
    /**
     * Delete a category (admin only)
     * @route DELETE /api/v1/categories/:id
     */
    static async deleteCategory(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ message: 'Invalid category ID' });
                return;
            }
            const result = await category_service_1.CategoryService.deleteCategory(id);
            if (!result) {
                res.status(404).json({ message: 'Category not found' });
                return;
            }
            res.status(204).send();
        }
        catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({ message: 'Failed to delete category' });
        }
    }
}
exports.CategoryController = CategoryController;
