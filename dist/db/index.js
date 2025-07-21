"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const config_1 = __importDefault(require("../config/config"));
// Create a connection pool
const pool = new pg_1.Pool({
    host: config_1.default.dbConfig.host,
    port: config_1.default.dbConfig.port,
    database: config_1.default.dbConfig.database,
    user: config_1.default.dbConfig.user,
    password: config_1.default.dbConfig.password,
    max: config_1.default.dbConfig.pool.max,
    idleTimeoutMillis: config_1.default.dbConfig.pool.idleTimeoutMillis,
    connectionTimeoutMillis: config_1.default.dbConfig.pool.connectionTimeoutMillis,
});
// Test the connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
exports.default = pool;
