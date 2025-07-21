import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import pool from './db';
import knexInstance from './services/db.service';
import './services/redis.service'; // Initialize Redis connection
import { setupSwagger } from './config/swagger';

// Load environment variables
dotenv.config();

// Import performance middleware
import { 
  compressionMiddleware, 
  responseTime, 
  securityHeaders 
} from './middleware/performance.middleware';
import { generalLimiter } from './middleware/rateLimiting.middleware';

// Import security middleware
import { 
  generateCSRFToken,
  csrfProtection
} from './middleware/security.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import transactionRoutes from './routes/transaction.routes';
import categoryRoutes from './routes/category.routes';
import analyticsRoutes from './routes/analytics.routes';
import cacheRoutes from './routes/cache.routes';

// Create Express app
const app: Express = express();
const PORT = process.env.PORT || 5000;

// Performance middleware (order matters)
app.use(responseTime); // Track response times
app.use(securityHeaders); // Add custom security headers

// Helmet configuration for additional security
app.use(helmet({
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

app.use(compressionMiddleware); // Compress responses

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Cookie parser (must be before CSRF)
app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Parse JSON with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded data

// Security middleware
app.use(generateCSRFToken); // Generate CSRF tokens
app.use(csrfProtection); // Protect against CSRF attacks

// Apply general rate limiting to all requests
app.use('/api', generalLimiter);

// Setup Swagger documentation
setupSwagger(app);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/cache', cacheRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Import error handlers
import { globalErrorHandler, notFoundHandler } from './utils/errorHandler';

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handling middleware
app.use(globalErrorHandler);

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL database:', err);
  } else {
    console.log('PostgreSQL database connected:', res.rows[0]);
  }
});

// Test Knex connection
knexInstance.raw('SELECT 1+1 AS result')
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

export default app;