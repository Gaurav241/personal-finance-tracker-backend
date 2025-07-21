import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import crypto from 'crypto';
import { AppError } from '../utils/errorHandler';

// Store for tracking failed login attempts
const failedAttempts = new Map<string, { count: number; lastAttempt: Date; blockedUntil?: Date }>();

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
export const bruteForceProtection = (req: Request, res: Response, next: NextFunction) => {
  const identifier = req.ip + ':' + (req.body?.email || 'unknown');
  const now = new Date();
  const attempt = failedAttempts.get(identifier);

  if (attempt) {
    // Check if user is currently blocked
    if (attempt.blockedUntil && attempt.blockedUntil > now) {
      const remainingTime = Math.ceil((attempt.blockedUntil.getTime() - now.getTime()) / 1000 / 60);
      return next(new AppError(`Too many failed attempts. Try again in ${remainingTime} minutes.`, 429));
    }

    // Progressive blocking: 5 attempts = 15 min, 10 attempts = 1 hour, 15+ attempts = 24 hours
    if (attempt.count >= 15) {
      attempt.blockedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      return next(new AppError('Account temporarily locked due to too many failed attempts. Try again in 24 hours.', 429));
    } else if (attempt.count >= 10) {
      attempt.blockedUntil = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
      return next(new AppError('Too many failed attempts. Try again in 1 hour.', 429));
    } else if (attempt.count >= 5) {
      attempt.blockedUntil = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
      return next(new AppError('Too many failed attempts. Try again in 15 minutes.', 429));
    }
  }

  // Store the identifier for potential failure tracking
  req.bruteForceIdentifier = identifier;
  next();
};

/**
 * Track failed login attempts
 */
export const trackFailedAttempt = (identifier: string) => {
  const now = new Date();
  const attempt = failedAttempts.get(identifier) || { count: 0, lastAttempt: now };
  
  attempt.count += 1;
  attempt.lastAttempt = now;
  
  failedAttempts.set(identifier, attempt);
};

/**
 * Clear failed attempts on successful login
 */
export const clearFailedAttempts = (identifier: string) => {
  failedAttempts.delete(identifier);
};

/**
 * Enhanced rate limiting for authentication endpoints
 */
export const authRateLimit = rateLimit({
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
  // Custom key generator to include email in rate limiting
  keyGenerator: (req: Request) => {
    return req.ip + ':' + (req.body?.email || 'unknown');
  }
});

/**
 * Slow down middleware for authentication
 */
export const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // Allow 2 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  // Skip successful requests
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => {
    return req.ip + ':' + (req.body?.email || 'unknown');
  }
});

/**
 * CSRF Protection using Double Submit Cookie pattern
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for login and register endpoints (they don't have tokens yet)
  if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
    return next();
  }

  const token = req.headers['x-csrf-token'] as string;
  const cookieToken = req.cookies?.csrfToken;

  if (!token || !cookieToken || token !== cookieToken) {
    return next(new AppError('Invalid CSRF token', 403));
  }

  next();
};

/**
 * Generate and set CSRF token
 */
export const generateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  if (!req.cookies?.csrfToken) {
    const token = crypto.randomBytes(32).toString('hex');
    
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

/**
 * Secure cookie configuration
 */
export const secureCookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  domain: process.env.COOKIE_DOMAIN || undefined
};

/**
 * Set secure session cookie
 */
export const setSecureSessionCookie = (res: Response, token: string) => {
  res.cookie('sessionToken', token, {
    ...secureCookieConfig,
    maxAge: 15 * 60 * 1000 // 15 minutes for session token
  });
};

/**
 * Set secure refresh token cookie
 */
export const setSecureRefreshCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    ...secureCookieConfig,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for refresh token
  });
};

/**
 * Clear authentication cookies
 */
export const clearAuthCookies = (res: Response) => {
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

/**
 * Password strength validation
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
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

/**
 * Account lockout middleware
 */
export const accountLockoutCheck = async (req: Request, res: Response, next: NextFunction) => {
  // This would typically check a database for account lockout status
  // For now, we'll use the brute force protection
  next();
};

// Extend Request interface to include brute force identifier
declare global {
  namespace Express {
    interface Request {
      bruteForceIdentifier?: string;
    }
  }
}