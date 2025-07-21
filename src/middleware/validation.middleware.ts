import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';
import { AppError } from '../utils/errorHandler';

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));
    
    return next(new AppError('Validation failed', 400, errorMessages));
  }
  next();
};

// Sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj, { 
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
      });
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// User validation rules
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('role')
    .optional()
    .isIn(['admin', 'user', 'read-only'])
    .withMessage('Role must be admin, user, or read-only'),
  
  sanitizeInput,
  handleValidationErrors
];

export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  sanitizeInput,
  handleValidationErrors
];

// Transaction validation rules
export const validateTransactionCreate = [
  body('amount')
    .isFloat({ min: 0.01, max: 999999999.99 })
    .withMessage('Amount must be a positive number up to 999,999,999.99'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  
  body('categoryId')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  
  body('transactionDate')
    .isISO8601()
    .withMessage('Transaction date must be a valid ISO 8601 date')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      if (date < oneYearAgo || date > oneYearFromNow) {
        throw new Error('Transaction date must be within one year of current date');
      }
      return true;
    }),
  
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  
  sanitizeInput,
  handleValidationErrors
];

export const validateTransactionUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Transaction ID must be a positive integer'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0.01, max: 999999999.99 })
    .withMessage('Amount must be a positive number up to 999,999,999.99'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  
  body('transactionDate')
    .optional()
    .isISO8601()
    .withMessage('Transaction date must be a valid ISO 8601 date')
    .custom((value) => {
      if (!value) return true;
      const date = new Date(value);
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      if (date < oneYearAgo || date > oneYearFromNow) {
        throw new Error('Transaction date must be within one year of current date');
      }
      return true;
    }),
  
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  
  sanitizeInput,
  handleValidationErrors
];

// Parameter validation
export const validateTransactionId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Transaction ID must be a positive integer'),
  
  sanitizeInput,
  handleValidationErrors
];

export const validateUserId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  sanitizeInput,
  handleValidationErrors
];

// Query validation
export const validateTransactionQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Page must be a positive integer up to 10,000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('category')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category must be a positive integer'),
  
  query('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (value && req.query?.startDate) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters'),
  
  sanitizeInput,
  handleValidationErrors
];

export const validateAnalyticsQuery = [
  query('period')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year'])
    .withMessage('Period must be week, month, quarter, or year'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (value && req.query?.startDate) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
        
        // Limit date range to prevent excessive data processing
        const maxRange = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years in milliseconds
        if (endDate.getTime() - startDate.getTime() > maxRange) {
          throw new Error('Date range cannot exceed 2 years');
        }
      }
      return true;
    }),
  
  sanitizeInput,
  handleValidationErrors
];

// Category validation
export const validateCategoryCreate = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s&-]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, ampersands, and hyphens'),
  
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code'),
  
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon must be less than 50 characters')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Icon can only contain letters, numbers, hyphens, and underscores'),
  
  sanitizeInput,
  handleValidationErrors
];

// User update validation
export const validateUserUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('role')
    .optional()
    .isIn(['admin', 'user', 'read-only'])
    .withMessage('Role must be admin, user, or read-only'),
  
  sanitizeInput,
  handleValidationErrors
];

// Password change validation
export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  sanitizeInput,
  handleValidationErrors
];