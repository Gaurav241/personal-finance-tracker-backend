"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeaders = exports.responseTime = exports.conditionalRequests = exports.mediumTermCache = exports.shortTermCache = exports.longTermCache = exports.noCache = exports.setCacheHeaders = exports.compressionMiddleware = void 0;
const compression_1 = __importDefault(require("compression"));
/**
 * Performance middleware for response optimization
 * Implements requirements 5.2, 5.3, 5.7: compression, caching headers
 */
// Compression middleware with custom configuration
exports.compressionMiddleware = (0, compression_1.default)({
    // Only compress responses larger than 1kb
    threshold: 1024,
    // Compression level (1-9, 6 is default)
    level: 6,
    // Only compress these MIME types
    filter: (req, res) => {
        // Don't compress if the request includes a Cache-Control: no-transform directive
        if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
            return false;
        }
        // Use compression filter function
        return compression_1.default.filter(req, res);
    }
});
// Cache control middleware for different types of responses
const setCacheHeaders = (maxAge = 300, isPrivate = true) => {
    return (req, res, next) => {
        const cacheControl = isPrivate ? 'private' : 'public';
        res.set({
            'Cache-Control': `${cacheControl}, max-age=${maxAge}`,
            'ETag': `"${Date.now()}"`, // Simple ETag implementation
            'Last-Modified': new Date().toUTCString()
        });
        next();
    };
};
exports.setCacheHeaders = setCacheHeaders;
// No cache middleware for sensitive endpoints
const noCache = (req, res, next) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
    });
    next();
};
exports.noCache = noCache;
// Long-term cache for static/rarely changing data
exports.longTermCache = (0, exports.setCacheHeaders)(86400, false); // 24 hours, public
// Short-term cache for dynamic data
exports.shortTermCache = (0, exports.setCacheHeaders)(300, true); // 5 minutes, private
// Medium-term cache for semi-static data
exports.mediumTermCache = (0, exports.setCacheHeaders)(3600, true); // 1 hour, private
// Conditional request handling middleware
const conditionalRequests = (req, res, next) => {
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
exports.conditionalRequests = conditionalRequests;
// Response time middleware
const responseTime = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        res.set('X-Response-Time', `${duration}ms`);
        // Log slow requests
        if (duration > 1000) {
            console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
        }
    });
    next();
};
exports.responseTime = responseTime;
// Security headers middleware
const securityHeaders = (req, res, next) => {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    });
    next();
};
exports.securityHeaders = securityHeaders;
