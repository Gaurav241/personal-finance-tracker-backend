"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = __importDefault(require("knex"));
const config_1 = __importDefault(require("../config/config"));
// Initialize knex with configuration
const knexInstance = (0, knex_1.default)({
    client: 'pg',
    connection: {
        host: config_1.default.dbConfig.host,
        port: config_1.default.dbConfig.port,
        database: config_1.default.dbConfig.database,
        user: config_1.default.dbConfig.user,
        password: config_1.default.dbConfig.password,
    },
    pool: {
        min: config_1.default.dbConfig.pool.min,
        max: config_1.default.dbConfig.pool.max,
        idleTimeoutMillis: config_1.default.dbConfig.pool.idleTimeoutMillis,
        acquireTimeoutMillis: config_1.default.dbConfig.pool.connectionTimeoutMillis,
    },
});
exports.default = knexInstance;
