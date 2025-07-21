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
], validation_middleware_1.handleValidationErrors, category_controller_1.CategoryController.getCategoriesByType);
/**
 * @route GET /api/v1/categories/:id
 * @desc Get category by ID
 * @access Public
 */
router.get('/:id', validation_middleware_1.validateUserId, category_controller_1.CategoryController.getCategoryById);
/**
 * @route POST /api/v1/categories
 * @desc Create a new category
 * @access Admin only
 */
router.post('/', auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(['admin']), validation_middleware_1.validateCategoryCreate, category_controller_1.CategoryController.createCategory);
/**
 * @route PUT /api/v1/categories/:id
 * @desc Update an existing category
 * @access Admin only
 */
router.put('/:id', auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(['admin']), validation_middleware_1.validateUserId, validation_middleware_1.validateCategoryCreate, // Reuse create validation for updates
category_controller_1.CategoryController.updateCategory);
/**
 * @route DELETE /api/v1/categories/:id
 * @desc Delete a category
 * @access Admin only
 */
router.delete('/:id', auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(['admin']), validation_middleware_1.validateUserId, category_controller_1.CategoryController.deleteCategory);
exports.default = router;
