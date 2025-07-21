"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const performance_middleware_1 = require("../middleware/performance.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const security_middleware_1 = require("../middleware/security.middleware");
const router = (0, express_1.Router)();
// Apply no-cache headers to all auth routes
router.use(performance_middleware_1.noCache);
/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', security_middleware_1.authRateLimit, security_middleware_1.authSlowDown, validation_middleware_1.validateUserRegistration, auth_controller_1.authController.register.bind(auth_controller_1.authController));
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', security_middleware_1.authRateLimit, security_middleware_1.authSlowDown, security_middleware_1.bruteForceProtection, validation_middleware_1.validateUserLogin, auth_controller_1.authController.login.bind(auth_controller_1.authController));
/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh user token
 * @access  Private
 */
router.post('/refresh', auth_controller_1.authController.refreshToken.bind(auth_controller_1.authController));
/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', auth_middleware_1.authenticateToken, auth_controller_1.authController.logout.bind(auth_controller_1.authController));
exports.default = router;
