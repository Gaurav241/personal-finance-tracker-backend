import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { body, param } from 'express-validator';

const router = Router();

/**
 * @route GET /api/v1/categories
 * @desc Get all categories
 * @access Public
 */
router.get('/', CategoryController.getAllCategories);

/**
 * @route GET /api/v1/categories/type/:type
 * @desc Get categories by type (income or expense)
 * @access Public
 */
router.get(
  '/type/:type',
  [
    param('type')
      .isIn(['income', 'expense'])
      .withMessage('Type must be either "income" or "expense"')
  ],
  validateRequest,
  CategoryController.getCategoriesByType
);

/**
 * @route GET /api/v1/categories/:id
 * @desc Get category by ID
 * @access Public
 */
router.get(
  '/:id',
  [
    param('id')
      .isInt()
      .withMessage('Category ID must be an integer')
  ],
  validateRequest,
  CategoryController.getCategoryById
);

/**
 * @route POST /api/v1/categories
 * @desc Create a new category
 * @access Admin only
 */
router.post(
  '/',
  ...authMiddleware(['admin']),
  [
    body('name')
      .notEmpty()
      .withMessage('Category name is required')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2 and 100 characters'),
    body('type')
      .notEmpty()
      .withMessage('Category type is required')
      .isIn(['income', 'expense'])
      .withMessage('Type must be either "income" or "expense"'),
    body('color')
      .optional()
      .isHexColor()
      .withMessage('Color must be a valid hex color code'),
    body('icon')
      .optional()
      .isString()
      .withMessage('Icon must be a string')
  ],
  validateRequest,
  CategoryController.createCategory
);

/**
 * @route PUT /api/v1/categories/:id
 * @desc Update an existing category
 * @access Admin only
 */
router.put(
  '/:id',
  ...authMiddleware(['admin']),
  [
    param('id')
      .isInt()
      .withMessage('Category ID must be an integer'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2 and 100 characters'),
    body('color')
      .optional()
      .isHexColor()
      .withMessage('Color must be a valid hex color code'),
    body('icon')
      .optional()
      .isString()
      .withMessage('Icon must be a string')
  ],
  validateRequest,
  CategoryController.updateCategory
);

/**
 * @route DELETE /api/v1/categories/:id
 * @desc Delete a category
 * @access Admin only
 */
router.delete(
  '/:id',
  ...authMiddleware(['admin']),
  [
    param('id')
      .isInt()
      .withMessage('Category ID must be an integer')
  ],
  validateRequest,
  CategoryController.deleteCategory
);

export default router;