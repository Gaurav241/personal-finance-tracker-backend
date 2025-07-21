"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticateToken);
/**
 * @route   GET /api/v1/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin only)
 */
router.get('/', (0, auth_middleware_1.authorizeRole)(['admin']), user_controller_1.userController.getAllUsers.bind(user_controller_1.userController));
/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID (admin can access any user, others only themselves)
 * @access  Private
 */
router.get('/:id', validation_middleware_1.validateUserId, user_controller_1.userController.getUserById.bind(user_controller_1.userController));
/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user (admin can update any user, others only themselves)
 * @access  Private
 */
router.put('/:id', validation_middleware_1.validateUserUpdate, user_controller_1.userController.updateUser.bind(user_controller_1.userController));
/**
 * @route   PUT /api/v1/users/:id/password
 * @desc    Change user password
 * @access  Private
 */
router.put('/:id/password', validation_middleware_1.validateUserId, validation_middleware_1.validatePasswordChange, user_controller_1.userController.changePassword.bind(user_controller_1.userController));
/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (admin only)
 * @access  Private (Admin only)
 */
router.delete('/:id', (0, auth_middleware_1.authorizeRole)(['admin']), validation_middleware_1.validateUserId, user_controller_1.userController.deleteUser.bind(user_controller_1.userController));
exports.default = router;
