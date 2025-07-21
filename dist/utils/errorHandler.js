"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.globalErrorHandler = exports.asyncHandler = exports.AppError = exports.ApiError = void 0;
/**
 * Custom error class for API errors
 */
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
/**
 * Enhanced error class with validation details
 */
class AppError extends Error {
    constructor(message, statusCode = 500, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Error handler for async route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * Global error handler middleware
 */
const globalErrorHandler = (err, req, res, next) => {
    // Set default error values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let details = err.details || undefined;
    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    }
    else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    }
    else if (err.code === '23505') { // PostgreSQL unique constraint error
        statusCode = 409;
        message = 'Resource already exists';
    }
    else if (err.code === '23503') { // PostgreSQL foreign key constraint error
        statusCode = 400;
        message = 'Referenced resource does not exist';
    }
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    // Log error for debugging (in production, use proper logging service)
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', {
            message: err.message,
            stack: err.stack,
            statusCode,
            details
        });
    }
    // Send error response
    const errorResponse = {
        success: false,
        message,
        ...(details && { details }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };
    res.status(statusCode).json(errorResponse);
};
exports.globalErrorHandler = globalErrorHandler;
/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
