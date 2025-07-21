/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Enhanced error class with validation details
 */
export class AppError extends Error {
  statusCode: number;
  details?: any[];
  isOperational: boolean;
  
  constructor(message: string, statusCode: number = 500, details?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler for async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware
 */
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || undefined;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === '23505') { // PostgreSQL unique constraint error
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.code === '23503') { // PostgreSQL foreign key constraint error
    statusCode = 400;
    message = 'Referenced resource does not exist';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
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
  const errorResponse: any = {
    success: false,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};