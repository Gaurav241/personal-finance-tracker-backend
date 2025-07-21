import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';
import { 
  validateCategoryCreate,
  validateUserId,
  handleValidationErrors
} from '../middleware/validation.middleware';
import { param } from 'express-validator';

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
  handleValidationErrors,
  CategoryController.getCategoriesByType
);

/**
 * @route GET /api/v1/categories/:id
 * @desc Get category by ID
 * @access Public
 */
router.get(
  '/:id',
  validateUserId,
  CategoryController.getCategoryById
);

/**
 * @route POST /api/v1/categories
 * @desc Create a new category
 * @access Admin only
 */
router.post(
  '/',
  authenticateToken,
  authorizeRole(['admin'] as UserRole[]),
  validateCategoryCreate,
  CategoryController.createCategory
);

/**
 * @route PUT /api/v1/categories/:id
 * @desc Update an existing category
 * @access Admin only
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRole(['admin'] as UserRole[]),
  validateUserId,
  validateCategoryCreate, // Reuse create validation for updates
  CategoryController.updateCategory
);

/**
 * @route DELETE /api/v1/categories/:id
 * @desc Delete a category
 * @access Admin only
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole(['admin'] as UserRole[]),
  validateUserId,
  CategoryController.deleteCategory
);

export default router;