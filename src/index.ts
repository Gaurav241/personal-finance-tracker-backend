import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import pool from './db';
import knexInstance from './services/db.service';
import './services/redis.service'; // Initialize Redis connection

// Load environment variables
dotenv.config();

// Import performance middleware
import { 
  compressionMiddleware, 
  responseTime, 
  securityHeaders 
} from './middleware/performance.middleware';
import { generalLimiter } from './middleware/rateLimiting.middleware';

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
app.use(securityHeaders); // Add security headers
app.use(helmet()); // Additional security headers
app.use(compressionMiddleware); // Compress responses
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '10mb' })); // Parse JSON with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded data

// Apply general rate limiting to all requests
app.use('/api', generalLimiter);

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

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
  });
});

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