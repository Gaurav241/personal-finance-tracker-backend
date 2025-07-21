"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = require("express-rate-limit");
const db_1 = __importDefault(require("./db"));
const db_service_1 = __importDefault(require("./services/db.service"));
require("./services/redis.service"); // Initialize Redis connection
// Load environment variables
dotenv_1.default.config();
// Import routes (to be implemented)
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
// Create Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
// Rate limiting
const apiLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
// Apply rate limiting to all requests
app.use(apiLimiter);
// Routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/users', user_routes_1.default);
app.use('/api/v1/transactions', transaction_routes_1.default);
app.use('/api/v1/categories', category_routes_1.default);
app.use('/api/v1/analytics', analytics_routes_1.default);
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
