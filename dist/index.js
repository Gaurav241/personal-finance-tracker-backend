"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./db"));
const db_service_1 = __importDefault(require("./services/db.service"));
require("./services/redis.service"); // Initialize Redis connection
// Load environment variables
dotenv_1.default.config();
// Import performance middleware
const performance_middleware_1 = require("./middleware/performance.middleware");
const rateLimiting_middleware_1 = require("./middleware/rateLimiting.middleware");
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
app.use(performance_middleware_1.securityHeaders); // Add security headers
app.use((0, helmet_1.default)()); // Additional security headers
app.use(performance_middleware_1.compressionMiddleware); // Compress responses
app.use((0, cors_1.default)()); // Enable CORS
app.use(express_1.default.json({ limit: '10mb' })); // Parse JSON with size limit
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded data
// Apply general rate limiting to all requests
app.use('/api', rateLimiting_middleware_1.generalLimiter);
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
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
    });
});
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
