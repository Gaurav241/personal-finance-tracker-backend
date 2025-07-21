"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const security_middleware_1 = require("../middleware/security.middleware");
/**
 * Authentication controller for handling auth-related requests
 */
class AuthController {
    /**
     * Register a new user
     * @param req Express request
     * @param res Express response
     */
    async register(req, res) {
        try {
            // Validate password strength
            const passwordValidation = (0, security_middleware_1.validatePasswordStrength)(req.body.password);
            if (!passwordValidation.isValid) {
                res.status(400).json({
                    message: 'Password does not meet security requirements',
                    errors: passwordValidation.errors
                });
                return;
            }
            // Extract user data from request body
            const userData = {
                email: req.body.email,
                password: req.body.password,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                role: req.body.role // This will be ignored unless admin creates the user
            };
            // Register user
            const result = await auth_service_1.authService.register(userData);
            // Set secure cookies for tokens
            (0, security_middleware_1.setSecureSessionCookie)(res, result.token);
            if (result.refreshToken) {
                (0, security_middleware_1.setSecureRefreshCookie)(res, result.refreshToken);
            }
            // Return user data and CSRF token (exclude sensitive token from response body)
            res.status(201).json({
                success: true,
                user: result.user,
                csrfToken: res.locals.csrfToken,
                message: 'User registered successfully'
            });
        }
        catch (error) {
            // Handle duplicate email error
            if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
                res.status(409).json({
                    success: false,
                    message: 'Email already in use'
                });
                return;
            }
            // Handle other errors
            res.status(500).json({
                success: false,
                message: error.message || 'Error registering user'
            });
        }
    }
    /**
     * Login a user
     * @param req Express request
     * @param res Express response
     */
    async login(req, res) {
        try {
            // Extract login data from request body
            const loginData = {
                email: req.body.email,
                password: req.body.password
            };
            // Login user
            const result = await auth_service_1.authService.login(loginData);
            // Clear failed attempts on successful login
            if (req.bruteForceIdentifier) {
                (0, security_middleware_1.clearFailedAttempts)(req.bruteForceIdentifier);
            }
            // Set secure cookies for tokens
            (0, security_middleware_1.setSecureSessionCookie)(res, result.token);
            if (result.refreshToken) {
                (0, security_middleware_1.setSecureRefreshCookie)(res, result.refreshToken);
            }
            // Return user data and CSRF token (exclude sensitive token from response body)
            res.status(200).json({
                success: true,
                user: result.user,
                csrfToken: res.locals.csrfToken,
                message: 'Login successful'
            });
        }
        catch (error) {
            // Track failed login attempt
            if (req.bruteForceIdentifier) {
                (0, security_middleware_1.trackFailedAttempt)(req.bruteForceIdentifier);
            }
            // Handle invalid credentials
            if (error.message === 'Invalid email or password' || error.message === 'Invalid credentials') {
                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
                return;
            }
            // Handle other errors
            res.status(500).json({
                success: false,
                message: 'Error logging in'
            });
        }
    }
    /**
     * Refresh user token
     * @param req Express request
     * @param res Express response
     */
    async refreshToken(req, res) {
        try {
            // Get refresh token from cookie
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) {
                res.status(401).json({
                    success: false,
                    message: 'Refresh token required'
                });
                return;
            }
            // Refresh token
            const result = await auth_service_1.authService.refreshToken(refreshToken);
            // Set new secure cookies
            (0, security_middleware_1.setSecureSessionCookie)(res, result.token);
            if (result.refreshToken) {
                (0, security_middleware_1.setSecureRefreshCookie)(res, result.refreshToken);
            }
            // Return success response
            res.status(200).json({
                success: true,
                user: result.user,
                csrfToken: res.locals.csrfToken,
                message: 'Token refreshed successfully'
            });
        }
        catch (error) {
            // Clear invalid cookies
            (0, security_middleware_1.clearAuthCookies)(res);
            // Handle user not found or invalid token
            if (error.message === 'User not found' || error.message === 'Invalid refresh token') {
                res.status(401).json({
                    success: false,
                    message: 'Invalid or expired refresh token'
                });
                return;
            }
            // Handle other errors
            res.status(500).json({
                success: false,
                message: 'Error refreshing token'
            });
        }
    }
    /**
     * Logout user
     * @param req Express request
     * @param res Express response
     */
    async logout(req, res) {
        try {
            // Clear authentication cookies
            (0, security_middleware_1.clearAuthCookies)(res);
            // Return success response
            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error logging out'
            });
        }
    }
}
exports.AuthController = AuthController;
// Export singleton instance
exports.authController = new AuthController();
