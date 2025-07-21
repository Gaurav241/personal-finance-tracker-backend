"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeAdmin = exports.authorizeWriteAccess = exports.authorizeOwnership = exports.authMiddleware = exports.authorizeRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config/config"));
/**
 * Middleware to verify JWT token
 * Implements requirement 1.3: "WHEN a user accesses protected routes THEN the system SHALL verify JWT token and role permissions"
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwtSecret);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Middleware to check if user has required role
 * Implements requirements:
 * - 1.4: "IF user has 'admin' role THEN the system SHALL grant full access to all features including user management"
 * - 1.5: "IF user has 'user' role THEN the system SHALL allow CRUD operations only on their own transactions and analytics"
 * - 1.6: "IF user has 'read-only' role THEN the system SHALL allow view-only access to their own data"
 * - 6.1: "WHEN backend routes are accessed THEN the system SHALL verify user role from JWT claims"
 * - 6.2: "WHEN 'admin' user accesses any endpoint THEN the system SHALL grant full access including user management"
 */
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        // Admin has access to everything
        if (req.user.role === 'admin') {
            return next();
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Insufficient permissions',
                requiredRoles: roles,
                userRole: req.user.role
            });
        }
        next();
    };
};
exports.authorizeRole = authorizeRole;
/**
 * Convenience function that combines authentication and authorization
 * @param roles Array of allowed roles
 * @returns Middleware function
 */
const authMiddleware = (roles = ['admin', 'user', 'read-only']) => {
    return [exports.authenticateToken, (0, exports.authorizeRole)(roles)];
};
exports.authMiddleware = authMiddleware;
/**
 * Middleware to ensure users can only access their own resources
 * Implements requirements:
 * - 6.3: "WHEN 'user' role accesses transaction endpoints THEN the system SHALL filter data to show only their own records"
 * - 6.4: "WHEN 'read-only' user attempts CRUD operations THEN the system SHALL reject with 403 Forbidden status"
 */
const authorizeOwnership = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    // Admin can access any resource
    if (req.user.role === 'admin') {
        return next();
    }
    // For non-admin users, ensure they can only access their own resources
    const resourceUserId = parseInt(req.params.userId || req.body.userId);
    if (resourceUserId && resourceUserId !== req.user.id) {
        return res.status(403).json({ message: 'You can only access your own resources' });
    }
    next();
};
exports.authorizeOwnership = authorizeOwnership;
/**
 * Middleware to restrict write operations for read-only users
 * Implements requirement 6.4: "WHEN 'read-only' user attempts CRUD operations THEN the system SHALL reject with 403 Forbidden status"
 */
const authorizeWriteAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    // Read-only users cannot perform write operations
    if (req.user.role === 'read-only' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        return res.status(403).json({
            message: 'Read-only users cannot perform write operations',
            method: req.method,
            userRole: req.user.role
        });
    }
    next();
};
exports.authorizeWriteAccess = authorizeWriteAccess;
/**
 * Middleware to restrict access to user management endpoints
 * Implements requirement 6.7: "WHEN user management endpoints are accessed THEN the system SHALL restrict access to 'admin' role only"
 */
const authorizeAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            message: 'Admin access required',
            userRole: req.user.role
        });
    }
    next();
};
exports.authorizeAdmin = authorizeAdmin;
