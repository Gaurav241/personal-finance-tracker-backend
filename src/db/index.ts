import { Pool } from 'pg';
import config from '../config/config';

// Create a connection pool
const pool = new Pool({
  host: config.dbConfig.host,
  port: config.dbConfig.port,
  database: config.dbConfig.database,
  user: config.dbConfig.user,
  password: config.dbConfig.password,
  max: config.dbConfig.pool.max,
  idleTimeoutMillis: config.dbConfig.pool.idleTimeoutMillis,
  connectionTimeoutMillis: config.dbConfig.pool.connectionTimeoutMillis,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;