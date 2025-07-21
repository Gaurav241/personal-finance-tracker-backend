import knex from 'knex';
import config from '../config/config';

// Initialize knex with configuration
const knexInstance = knex({
  client: 'pg',
  connection: {
    host: config.dbConfig.host,
    port: config.dbConfig.port,
    database: config.dbConfig.database,
    user: config.dbConfig.user,
    password: config.dbConfig.password,
  },
  pool: {
    min: config.dbConfig.pool.min,
    max: config.dbConfig.pool.max,
    idleTimeoutMillis: config.dbConfig.pool.idleTimeoutMillis,
    acquireTimeoutMillis: config.dbConfig.pool.connectionTimeoutMillis,
  },
});

export default knexInstance;