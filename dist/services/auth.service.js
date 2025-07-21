"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_service_1 = require("./user.service");
const config_1 = __importDefault(require("../config/config"));
/**
 * Authentication service for handling user authentication and token management
 */
class AuthService {
    /**
     * Register a new user
     * @param userData User registration data
     * @returns Authentication result with user and token
     */
    async register(userData) {
        // Create user using user service
        const user = await user_service_1.userService.createUser(userData);
        // Generate token for the new user
        const token = this.generateToken(user);
        return { user, token };
    }
    /**
     * Login a user
     * @param loginData User login credentials
     * @returns Authentication result with user and token
     * @throws Error if credentials are invalid
     */
    async login(loginData) {
        // Get user by email
        const user = await user_service_1.userService.getUserByEmail(loginData.email);
        // Check if user exists
        if (!user) {
            throw new Error('Invalid email or password');
        }
        // Verify password
        const isPasswordValid = await user_service_1.userService.verifyPassword(loginData.password, user.password);
        // Check if password is valid
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        // Generate token
        const token = this.generateToken({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: user.createdAt
        });
        // Return user without password and token
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                createdAt: user.createdAt
            },
            token
        };
    }
    /**
     * Refresh user token
     * @param userId User ID from existing token
     * @returns New token
     * @throws Error if user not found
     */
    async refreshToken(userId) {
        // Get user by ID
        const user = await user_service_1.userService.getUserById(userId);
        // Check if user exists
        if (!user) {
            throw new Error('User not found');
        }
        // Generate new token
        return this.generateToken(user);
    }
    /**
     * Generate JWT token for user
     * @param user User data to include in token
     * @returns JWT token
     */
    generateToken(user) {
        // Create payload with user data
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        // Sign token with secret and expiration
        return jsonwebtoken_1.default.sign(payload, config_1.default.jwtSecret, {
            expiresIn: config_1.default.jwtExpiresIn
        });
    }
    /**
     * Verify and decode JWT token
     * @param token JWT token to verify
     * @returns Decoded token payload or null if invalid
     */
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.default.jwtSecret);
        }
        catch (error) {
            return null;
        }
    }
}
exports.AuthService = AuthService;
// Export singleton instance
exports.authService = new AuthService();
