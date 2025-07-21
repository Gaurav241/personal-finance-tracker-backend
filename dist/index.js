"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./db"));
const db_service_1 = __importDefault(require("./services/db.service"));
require("./services/redis.service"); // Initialize Redis connection
const swagger_1 = require("./config/swagger");
// Load environment variables
dotenv_1.default.config();
// Import performance middleware
const performance_middleware_1 = require("./middleware/performance.middleware");
const rateLimiting_middleware_1 = require("./middleware/rateLimiting.middleware");
// Import security middleware
const security_middleware_1 = require("./middleware/security.middleware");
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const cache_routes_1 = __importDefault(require("./routes/cache.routes"));
// Create Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Performance middleware (order matters)
app.use(performance_middleware_1.responseTime); // Track response times
app.use(performance_middleware_1.securityHeaders); // Add custom security headers
// Helmet configuration for additional security
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // We handle CSP in securityHeaders
    crossOriginEmbedderPolicy: false, // We handle COEP in securityHeaders
    hsts: process.env.NODE_ENV === 'production' ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    } : false,
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
app.use(performance_middleware_1.compressionMiddleware); // Compress responses
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
// Cookie parser (must be before CSRF)
app.use((0, cookie_parser_1.default)());
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' })); // Parse JSON with size limit
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded data
// Security middleware
app.use(security_middleware_1.generateCSRFToken); // Generate CSRF tokens
app.use(security_middleware_1.csrfProtection); // Protect against CSRF attacks
// Apply general rate limiting to all requests
app.use('/api', rateLimiting_middleware_1.generalLimiter);
// Setup Swagger documentation
(0, swagger_1.setupSwagger)(app);
// Routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/users', user_routes_1.default);
app.use('/api/v1/transactions', transaction_routes_1.default);
app.use('/api/v1/categories', category_routes_1.default);
app.use('/api/v1/analytics', analytics_routes_1.default);
app.use('/api/v1/cache', cache_routes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});
// Import error handlers
const errorHandler_1 = require("./utils/errorHandler");
// 404 handler for undefined routes
app.use(errorHandler_1.notFoundHandler);
// Global error handling middleware
app.use(errorHandler_1.globalErrorHandler);
// Test database connection
db_1.default.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to PostgreSQL database:', err);
    }
    else {
        console.log('PostgreSQL database connected:', res.rows[0]);
    }
});
// Test Knex connection
db_service_1.default.raw('SELECT 1+1 AS result')
    .then(() => {
    console.log('Knex connected to PostgreSQL database');
})
    .catch((err) => {
    console.error('Error connecting Knex to PostgreSQL database:', err);
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
exports.default = app;
