"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePasswordChange = exports.validateUserUpdate = exports.validateCategoryCreate = exports.validateAnalyticsQuery = exports.validateTransactionQuery = exports.validateUserId = exports.validateTransactionId = exports.validateTransactionUpdate = exports.validateTransactionCreate = exports.validateUserLogin = exports.validateUserRegistration = exports.sanitizeInput = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
const errorHandler_1 = require("../utils/errorHandler");
// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.type === 'field' ? error.path : 'unknown',
            message: error.msg,
            value: error.type === 'field' ? error.value : undefined
        }));
        return next(new errorHandler_1.AppError('Validation failed', 400, errorMessages));
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
// Sanitization middleware
const sanitizeInput = (req, res, next) => {
    const sanitizeObject = (obj) => {
        if (typeof obj === 'string') {
            return isomorphic_dompurify_1.default.sanitize(obj, {
                ALLOWED_TAGS: [],
                ALLOWED_ATTR: [],
                KEEP_CONTENT: true
            });
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }
        if (obj && typeof obj === 'object') {
            const sanitized = {};
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
exports.sanitizeInput = sanitizeInput;
// User validation rules
exports.validateUserRegistration = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address')
        .isLength({ max: 255 })
        .withMessage('Email must be less than 255 characters'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    (0, express_validator_1.body)('firstName')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('First name must be between 1 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    (0, express_validator_1.body)('lastName')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name must be between 1 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
    (0, express_validator_1.body)('role')
        .optional()
        .isIn(['admin', 'user', 'read-only'])
        .withMessage('Role must be admin, user, or read-only'),
    exports.sanitizeInput,
    exports.handleValidationErrors
];
exports.validateUserLogin = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required'),
    exports.sanitizeInput,
    exports.handleValidationErrors
];
// Transaction validation rules
exports.validateTransactionCreate = [
    (0, express_validator_1.body)('amount')
        .isFloat({ min: 0.01, max: 999999999.99 })
        .withMessage('Amount must be a positive number up to 999,999,999.99'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    (0, express_validator_1.body)('categoryId')
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),
    (0, express_validator_1.body)('transactionDate')
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
    (0, express_validator_1.body)('type')
        .isIn(['income', 'expense'])
        .withMessage('Type must be either income or expense'),
    exports.sanitizeInput,
    exports.handleValidationErrors
];
exports.validateTransactionUpdate = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Transaction ID must be a positive integer'),
    (0, express_validator_1.body)('amount')
        .optional()
        .isFloat({ min: 0.01, max: 999999999.99 })
        .withMessage('Amount must be a positive number up to 999,999,999.99'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    (0, express_validator_1.body)('categoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),
    (0, express_validator_1.body)('transactionDate')
        .optional()
        .isISO8601()
        .withMessage('Transaction date must be a valid ISO 8601 date')
        .custom((value) => {
        if (!value)
            return true;
        const date = new Date(value);
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        if (date < oneYearAgo || date > oneYearFromNow) {
            throw new Error('Transaction date must be within one year of current date');
        }
        return true;
    }),
    (0, express_validator_1.body)('type')
        .optional()
        .isIn(['income', 'expense'])
        .withMessage('Type must be either income or expense'),
    exports.sanitizeInput,
    exports.handleValidationErrors
];
// Parameter validation
exports.validateTransactionId = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Transaction ID must be a positive integer'),
    exports.sanitizeInput,
    exports.handleValidationErrors
];
exports.validateUserId = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('User ID must be a positive integer'),
    exports.sanitizeInput,
    exports.handleValidationErrors
];
// Query validation
exports.validateTransactionQuery = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1, max: 10000 })
        .withMessage('Page must be a positive integer up to 10,000'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('category')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Category must be a positive integer'),
    (0, express_validator_1.query)('type')
        .optional()
        .isIn(['income', 'expense'])
        .withMessage('Type must be either income or expense'),
    (0, express_validator_1.query)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
    (0, express_validator_1.query)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date')
        .custom((value, { req }) => {
        if (value && req.query?.startDate) {
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(value);
            if (endDate <= startDate) {
                throw new Error('End date must be after start date');
            }
        }
        return true;
    }),
    (0, express_validator_1.query)('search')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Search term must be less than 100 characters'),
    exports.sanitizeInput,
    exports.handleValidationErrors
];
exports.validateAnalyticsQuery = [
    (0, express_validator_1.query)('period')
        .optional()
        .isIn(['week', 'month', 'quarter', 'year'])
        .withMessage('Period must be week, month, quarter, or year'),
    (0, express_validator_1.query)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
    (0, express_validator_1.query)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date')
        .custom((value, { req }) => {
        if (value && req.query?.startDate) {
            const startDate = new Date(req.query.startDate);
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
    exports.sanitizeInput,
    exports.handleValidationErrors
];
// Category validation
exports.validateCategoryCreate = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Category name must be between 1 and 100 characters')
        .matches(/^[a-zA-Z0-9\s&-]+$/)
        .withMessage('Category name can only contain letters, numbers, spaces, ampersands, and hyphens'),
    (0, express_validator_1.body)('type')
        .isIn(['income', 'expense'])
        .withMessage('Type must be either income or expense'),
    (0, express_validator_1.body)('color')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage('Color must be a valid hex color code'),
    (0, express_validator_1.body)('icon')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Icon must be less than 50 characters')
        .matches(/^[a-zA-Z0-9-_]+$/)
        .withMessage('Icon can only contain letters, numbers, hyphens, and underscores'),
    exports.sanitizeInput,
    exports.handleValidationErrors
];
// User update validation
exports.validateUserUpdate = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('User ID must be a positive integer'),
    (0, express_validator_1.body)('firstName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('First name must be between 1 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    (0, express_validator_1.body)('lastName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name must be between 1 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
    (0, express_validator_1.body)('role')
        .optional()
        .isIn(['admin', 'user', 'read-only'])
        .withMessage('Role must be admin, user, or read-only'),
    exports.sanitizeInput,
    exports.handleValidationErrors
];
// Password change validation
exports.validatePasswordChange = [
    (0, express_validator_1.body)('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
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
    (0, express_validator_1.body)('confirmPassword')
        .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Password confirmation does not match new password');
        }
        return true;
    }),
    exports.sanitizeInput,
    exports.handleValidationErrors
];
