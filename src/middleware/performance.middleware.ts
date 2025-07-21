import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

/**
 * Performance middleware for response optimization
 * Implements requirements 5.2, 5.3, 5.7: compression, caching headers
 */

// Compression middleware with custom configuration
export const compressionMiddleware = compression({
  // Only compress responses larger than 1kb
  threshold: 1024,
  
  // Compression level (1-9, 6 is default)
  level: 6,
  
  // Only compress these MIME types
  filter: (req: Request, res: Response) => {
    // Don't compress if the request includes a Cache-Control: no-transform directive
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }
    
    // Use compression filter function
    return compression.filter(req, res);
  }
});

// Cache control middleware for different types of responses
export const setCacheHeaders = (maxAge: number = 300, isPrivate: boolean = true) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const cacheControl = isPrivate ? 'private' : 'public';
    res.set({
      'Cache-Control': `${cacheControl}, max-age=${maxAge}`,
      'ETag': `"${Date.now()}"`, // Simple ETag implementation
      'Last-Modified': new Date().toUTCString()
    });
    next();
  };
};

// No cache middleware for sensitive endpoints
export const noCache = (req: Request, res: Response, next: NextFunction) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
};

// Long-term cache for static/rarely changing data
export const longTermCache = setCacheHeaders(86400, false); // 24 hours, public

// Short-term cache for dynamic data
export const shortTermCache = setCacheHeaders(300, true); // 5 minutes, private

// Medium-term cache for semi-static data
export const mediumTermCache = setCacheHeaders(3600, true); // 1 hour, private

// Conditional request handling middleware
export const conditionalRequests = (req: Request, res: Response, next: NextFunction) => {
  // Handle If-None-Match (ETag)
  const ifNoneMatch = req.headers['if-none-match'];
  const etag = res.get('ETag');
  
  if (ifNoneMatch && etag && ifNoneMatch === etag) {
    return res.status(304).end();
  }
  
  // Handle If-Modified-Since
  const ifModifiedSince = req.headers['if-modified-since'];
  const lastModified = res.get('Last-Modified');
  
  if (ifModifiedSince && lastModified) {
    const ifModifiedSinceDate = new Date(ifModifiedSince);
    const lastModifiedDate = new Date(lastModified);
    
    if (ifModifiedSinceDate >= lastModifiedDate) {
      return res.status(304).end();
    }
  }
  
  next();
};

// Response time middleware
export const responseTime = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  // Set response time header before sending response
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    res.set('X-Response-Time', `${duration}ms`);
    return originalSend.call(this, body);
  };
  
  next();
};

// Enhanced security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for development
    "style-src 'self' 'unsafe-inline'", // Allow inline styles
    "img-src 'self' data: https:",
    "font-src 'self' https:",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "child-src 'none'",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "manifest-src 'self'"
  ].join('; ');

  res.set({
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Content Security Policy
    'Content-Security-Policy': csp,
    
    // Permissions Policy (formerly Feature Policy)
    'Permissions-Policy': [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'speaker=()',
      'vibrate=()',
      'fullscreen=(self)',
      'sync-xhr=()'
    ].join(', '),
    
    // Strict Transport Security (HTTPS only)
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }),
    
    // Prevent DNS prefetching
    'X-DNS-Prefetch-Control': 'off',
    
    // Disable powered by header
    'X-Powered-By': '',
    
    // Cross-Origin policies
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  });
  
  next();
};