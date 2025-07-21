"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const express_validator_1 = require("express-validator");
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
            // Check for validation errors
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
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
            // Return user and token
            res.status(201).json(result);
        }
        catch (error) {
            // Handle duplicate email error
            if (error.message.includes('duplicate key')) {
                res.status(409).json({ message: 'Email already in use' });
                return;
            }
            // Handle other errors
            res.status(500).json({ message: error.message || 'Error registering user' });
        }
    }
    /**
     * Login a user
     * @param req Express request
     * @param res Express response
     */
    async login(req, res) {
        try {
            // Check for validation errors
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            // Extract login data from request body
            const loginData = {
                email: req.body.email,
                password: req.body.password
            };
            // Login user
            const result = await auth_service_1.authService.login(loginData);
            // Return user and token
            res.status(200).json(result);
        }
        catch (error) {
            // Handle invalid credentials
            if (error.message === 'Invalid email or password') {
                res.status(401).json({ message: error.message });
                return;
            }
            // Handle other errors
            res.status(500).json({ message: 'Error logging in' });
        }
    }
    /**
     * Refresh user token
     * @param req Express request
     * @param res Express response
     */
    async refreshToken(req, res) {
        try {
            // Get user ID from authenticated request
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ message: 'Authentication required' });
                return;
            }
            // Refresh token
            const token = await auth_service_1.authService.refreshToken(userId);
            // Return new token
            res.status(200).json({ token });
        }
        catch (error) {
            // Handle user not found
            if (error.message === 'User not found') {
                res.status(404).json({ message: error.message });
                return;
            }
            // Handle other errors
            res.status(500).json({ message: 'Error refreshing token' });
        }
    }
}
exports.AuthController = AuthController;
// Export singleton instance
exports.authController = new AuthController();
