"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountLockoutCheck = exports.validatePasswordStrength = exports.clearAuthCookies = exports.setSecureRefreshCookie = exports.setSecureSessionCookie = exports.secureCookieConfig = exports.generateCSRFToken = exports.csrfProtection = exports.authSlowDown = exports.authRateLimit = exports.clearFailedAttempts = exports.trackFailedAttempt = exports.bruteForceProtection = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
const crypto_1 = __importDefault(require("crypto"));
const errorHandler_1 = require("../utils/errorHandler");
// Store for tracking failed login attempts
const failedAttempts = new Map();
// Cleanup old entries every hour
setInterval(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    for (const [key, value] of failedAttempts.entries()) {
        if (value.lastAttempt < oneHourAgo && (!value.blockedUntil || value.blockedUntil < now)) {
            failedAttempts.delete(key);
        }
    }
}, 60 * 60 * 1000); // Run every hour
/**
 * Brute force protection middleware
 */
const bruteForceProtection = (req, res, next) => {
    const identifier = req.ip + ':' + (req.body?.email || 'unknown');
    const now = new Date();
    const attempt = failedAttempts.get(identifier);
    if (attempt) {
        // Check if user is currently blocked
        if (attempt.blockedUntil && attempt.blockedUntil > now) {
            const remainingTime = Math.ceil((attempt.blockedUntil.getTime() - now.getTime()) / 1000 / 60);
            return next(new errorHandler_1.AppError(`Too many failed attempts. Try again in ${remainingTime} minutes.`, 429));
        }
        // Progressive blocking: 5 attempts = 15 min, 10 attempts = 1 hour, 15+ attempts = 24 hours
        if (attempt.count >= 15) {
            attempt.blockedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
            return next(new errorHandler_1.AppError('Account temporarily locked due to too many failed attempts. Try again in 24 hours.', 429));
        }
        else if (attempt.count >= 10) {
            attempt.blockedUntil = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
            return next(new errorHandler_1.AppError('Too many failed attempts. Try again in 1 hour.', 429));
        }
        else if (attempt.count >= 5) {
            attempt.blockedUntil = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
            return next(new errorHandler_1.AppError('Too many failed attempts. Try again in 15 minutes.', 429));
        }
    }
    // Store the identifier for potential failure tracking
    req.bruteForceIdentifier = identifier;
    next();
};
exports.bruteForceProtection = bruteForceProtection;
/**
 * Track failed login attempts
 */
const trackFailedAttempt = (identifier) => {
    const now = new Date();
    const attempt = failedAttempts.get(identifier) || { count: 0, lastAttempt: now };
    attempt.count += 1;
    attempt.lastAttempt = now;
    failedAttempts.set(identifier, attempt);
};
exports.trackFailedAttempt = trackFailedAttempt;
/**
 * Clear failed attempts on successful login
 */
const clearFailedAttempts = (identifier) => {
    failedAttempts.delete(identifier);
};
exports.clearFailedAttempts = clearFailedAttempts;
/**
 * Enhanced rate limiting for authentication endpoints
 */
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests
    skipSuccessfulRequests: true,
    // Use default key generator to avoid IPv6 issues
    keyGenerator: (req) => {
        return req.ip || 'unknown';
    }
});
/**
 * Slow down middleware for authentication
 */
exports.authSlowDown = (0, express_slow_down_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 2, // Allow 2 requests per windowMs without delay
    delayMs: 500, // Add 500ms delay per request after delayAfter
    maxDelayMs: 20000, // Maximum delay of 20 seconds
    // Skip successful requests
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        return req.ip + ':' + (req.body?.email || 'unknown');
    }
});
/**
 * CSRF Protection using Double Submit Cookie pattern
 */
const csrfProtection = (req, res, next) => {
    // Skip CSRF for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    // Skip CSRF for login and register endpoints (they don't have tokens yet)
    if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
        return next();
    }
    const token = req.headers['x-csrf-token'];
    const cookieToken = req.cookies?.csrfToken;
    if (!token || !cookieToken || token !== cookieToken) {
        return next(new errorHandler_1.AppError('Invalid CSRF token', 403));
    }
    next();
};
exports.csrfProtection = csrfProtection;
/**
 * Generate and set CSRF token
 */
const generateCSRFToken = (req, res, next) => {
    if (!req.cookies?.csrfToken) {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        // Set secure cookie
        res.cookie('csrfToken', token, {
            httpOnly: false, // Client needs to read this for CSRF header
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        // Also send in response for client to use
        res.locals.csrfToken = token;
    }
    next();
};
exports.generateCSRFToken = generateCSRFToken;
/**
 * Secure cookie configuration
 */
exports.secureCookieConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: process.env.COOKIE_DOMAIN || undefined
};
/**
 * Set secure session cookie
 */
const setSecureSessionCookie = (res, token) => {
    res.cookie('sessionToken', token, {
        ...exports.secureCookieConfig,
        maxAge: 15 * 60 * 1000 // 15 minutes for session token
    });
};
exports.setSecureSessionCookie = setSecureSessionCookie;
/**
 * Set secure refresh token cookie
 */
const setSecureRefreshCookie = (res, token) => {
    res.cookie('refreshToken', token, {
        ...exports.secureCookieConfig,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for refresh token
    });
};
exports.setSecureRefreshCookie = setSecureRefreshCookie;
/**
 * Clear authentication cookies
 */
const clearAuthCookies = (res) => {
    res.clearCookie('sessionToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.clearCookie('csrfToken', {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
};
exports.clearAuthCookies = clearAuthCookies;
/**
 * Password strength validation
 */
const validatePasswordStrength = (password) => {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
        errors.push('Password must be less than 128 characters long');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[@$!%*?&]/.test(password)) {
        errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    // Check for common patterns
    const commonPatterns = [
        /(.)\1{2,}/, // Repeated characters (aaa, 111)
        /123|234|345|456|567|678|789|890/, // Sequential numbers
        /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // Sequential letters
        /password|123456|qwerty|admin|user|login/i // Common passwords
    ];
    for (const pattern of commonPatterns) {
        if (pattern.test(password)) {
            errors.push('Password contains common patterns and is not secure');
            break;
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validatePasswordStrength = validatePasswordStrength;
/**
 * Account lockout middleware
 */
const accountLockoutCheck = async (req, res, next) => {
    // This would typically check a database for account lockout status
    // For now, we'll use the brute force protection
    next();
};
exports.accountLockoutCheck = accountLockoutCheck;
