import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  dbConfig: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    pool: {
      min: number;
      max: number;
      idleTimeoutMillis: number;
      connectionTimeoutMillis: number;
    };
  };
  redisConfig: {
    host: string;
    port: number;
    password: string | null;
  };
}

const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  dbConfig: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'finance_tracker',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '2000', 10),
    },
  },
  redisConfig: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || null,
  },
};

export default config;