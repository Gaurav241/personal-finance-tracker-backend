import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { 
  authenticateToken, 
  authorizeRole 
} from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';
import {
  validateUserId,
  validateUserUpdate,
  validatePasswordChange
} from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/',
  authorizeRole(['admin'] as UserRole[]),
  userController.getAllUsers.bind(userController)
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID (admin can access any user, others only themselves)
 * @access  Private
 */
router.get(
  '/:id',
  validateUserId,
  userController.getUserById.bind(userController)
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user (admin can update any user, others only themselves)
 * @access  Private
 */
router.put(
  '/:id',
  validateUserUpdate,
  userController.updateUser.bind(userController)
);

/**
 * @route   PUT /api/v1/users/:id/password
 * @desc    Change user password
 * @access  Private
 */
router.put(
  '/:id/password',
  validateUserId,
  validatePasswordChange,
  userController.changePassword.bind(userController)
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (admin only)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authorizeRole(['admin'] as UserRole[]),
  validateUserId,
  userController.deleteUser.bind(userController)
);

export default router;