"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
/**
 * @route GET /api/v1/categories
 * @desc Get all categories
 * @access Public
 */
router.get('/', category_controller_1.CategoryController.getAllCategories);
/**
 * @route GET /api/v1/categories/type/:type
 * @desc Get categories by type (income or expense)
 * @access Public
 */
router.get('/type/:type', [
    (0, express_validator_1.param)('type')
        .isIn(['income', 'expense'])
        .withMessage('Type must be either "income" or "expense"')
], validation_middleware_1.validateRequest, category_controller_1.CategoryController.getCategoriesByType);
/**
 * @route GET /api/v1/categories/:id
 * @desc Get category by ID
 * @access Public
 */
router.get('/:id', [
    (0, express_validator_1.param)('id')
        .isInt()
        .withMessage('Category ID must be an integer')
], validation_middleware_1.validateRequest, category_controller_1.CategoryController.getCategoryById);
/**
 * @route POST /api/v1/categories
 * @desc Create a new category
 * @access Admin only
 */
router.post('/', ...(0, auth_middleware_1.authMiddleware)(['admin']), [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Category name is required')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('type')
        .notEmpty()
        .withMessage('Category type is required')
        .isIn(['income', 'expense'])
        .withMessage('Type must be either "income" or "expense"'),
    (0, express_validator_1.body)('color')
        .optional()
        .isHexColor()
        .withMessage('Color must be a valid hex color code'),
    (0, express_validator_1.body)('icon')
        .optional()
        .isString()
        .withMessage('Icon must be a string')
], validation_middleware_1.validateRequest, category_controller_1.CategoryController.createCategory);
/**
 * @route PUT /api/v1/categories/:id
 * @desc Update an existing category
 * @access Admin only
 */
router.put('/:id', ...(0, auth_middleware_1.authMiddleware)(['admin']), [
    (0, express_validator_1.param)('id')
        .isInt()
        .withMessage('Category ID must be an integer'),
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('color')
        .optional()
        .isHexColor()
        .withMessage('Color must be a valid hex color code'),
    (0, express_validator_1.body)('icon')
        .optional()
        .isString()
        .withMessage('Icon must be a string')
], validation_middleware_1.validateRequest, category_controller_1.CategoryController.updateCategory);
/**
 * @route DELETE /api/v1/categories/:id
 * @desc Delete a category
 * @access Admin only
 */
router.delete('/:id', ...(0, auth_middleware_1.authMiddleware)(['admin']), [
    (0, express_validator_1.param)('id')
        .isInt()
        .withMessage('Category ID must be an integer')
], validation_middleware_1.validateRequest, category_controller_1.CategoryController.deleteCategory);
exports.default = router;
