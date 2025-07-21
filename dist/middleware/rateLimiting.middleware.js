"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLimiter = exports.analyticsLimiter = exports.transactionLimiter = exports.authLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = require("express-rate-limit");
/**
 * Rate limiting configurations for different endpoints
 * Implements requirements 5.1, 5.2, 5.3, 5.7
 */
// General API rate limiter
exports.generalLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});
// Strict rate limiter for authentication endpoints
exports.authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // Limit each IP to 5 login attempts per windowMs
    message: {
        error: 'Too many authentication attempts from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Don't count successful requests
});
// Moderate rate limiter for transaction endpoints
exports.transactionLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 30, // Limit each IP to 30 transaction requests per minute
    message: {
        error: 'Too many transaction requests from this IP, please try again later.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});
// Lenient rate limiter for analytics endpoints (read-heavy)
exports.analyticsLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 60, // Limit each IP to 60 analytics requests per minute
    message: {
        error: 'Too many analytics requests from this IP, please try again later.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});
// Very strict rate limiter for admin operations
exports.adminLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 20, // Limit each IP to 20 admin requests per 5 minutes
    message: {
        error: 'Too many admin requests from this IP, please try again later.',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});
