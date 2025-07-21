"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_rate_limit_1 = require("express-rate-limit");
const router = (0, express_1.Router)();
// Rate limiter for authentication endpoints (5 requests per 15 minutes)
const authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // 5 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts, please try again later' }
});
/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authLimiter, [
    // Validate email
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    // Validate password
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    // Validate first name
    (0, express_validator_1.body)('firstName')
        .notEmpty()
        .withMessage('First name is required')
        .trim()
        .escape(),
    // Validate last name
    (0, express_validator_1.body)('lastName')
        .notEmpty()
        .withMessage('Last name is required')
        .trim()
        .escape()
], auth_controller_1.authController.register.bind(auth_controller_1.authController));
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', authLimiter, [
    // Validate email
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    // Validate password
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required')
], auth_controller_1.authController.login.bind(auth_controller_1.authController));
/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh user token
 * @access  Private
 */
router.post('/refresh', auth_middleware_1.authenticateToken, auth_controller_1.authController.refreshToken.bind(auth_controller_1.authController));
exports.default = router;
