import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { noCache } from '../middleware/performance.middleware';
import { 
  validateUserRegistration, 
  validateUserLogin 
} from '../middleware/validation.middleware';
import {
  authRateLimit,
  authSlowDown,
  bruteForceProtection
} from '../middleware/security.middleware';

const router = Router();

// Apply no-cache headers to all auth routes
router.use(noCache);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authRateLimit,
  authSlowDown,
  validateUserRegistration,
  authController.register.bind(authController)
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post(
  '/login',
  authRateLimit,
  authSlowDown,
  bruteForceProtection,
  validateUserLogin,
  authController.login.bind(authController)
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh user token
 * @access  Private
 */
router.post(
  '/refresh',
  authController.refreshToken.bind(authController)
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticateToken,
  authController.logout.bind(authController)
);

export default router;