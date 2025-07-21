import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiting.middleware';
import { noCache } from '../middleware/performance.middleware';
import { validateRequest } from '../middleware/validation.middleware';

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
  authLimiter,
  [
    // Validate email
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    // Validate password
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    // Validate first name
    body('firstName')
      .notEmpty()
      .withMessage('First name is required')
      .trim()
      .escape(),
    
    // Validate last name
    body('lastName')
      .notEmpty()
      .withMessage('Last name is required')
      .trim()
      .escape()
  ],
  validateRequest,
  authController.register.bind(authController)
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  [
    // Validate email
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    // Validate password
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validateRequest,
  authController.login.bind(authController)
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh user token
 * @access  Private
 */
router.post(
  '/refresh',
  authenticateToken,
  authController.refreshToken.bind(authController)
);

export default router;