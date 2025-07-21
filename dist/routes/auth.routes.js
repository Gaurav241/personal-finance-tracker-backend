"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiting_middleware_1 = require("../middleware/rateLimiting.middleware");
const performance_middleware_1 = require("../middleware/performance.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = (0, express_1.Router)();
// Apply no-cache headers to all auth routes
router.use(performance_middleware_1.noCache);
/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', rateLimiting_middleware_1.authLimiter, [
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
], validation_middleware_1.validateRequest, auth_controller_1.authController.register.bind(auth_controller_1.authController));
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', rateLimiting_middleware_1.authLimiter, [
    // Validate email
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    // Validate password
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required')
], validation_middleware_1.validateRequest, auth_controller_1.authController.login.bind(auth_controller_1.authController));
/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh user token
 * @access  Private
 */
router.post('/refresh', auth_middleware_1.authenticateToken, auth_controller_1.authController.refreshToken.bind(auth_controller_1.authController));
exports.default = router;
