"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const config_1 = __importDefault(require("../config/config"));
// Create Redis client
const redisClient = (0, redis_1.createClient)({
    url: `redis://${config_1.default.redisConfig.password ? config_1.default.redisConfig.password + '@' : ''}${config_1.default.redisConfig.host}:${config_1.default.redisConfig.port}`,
});
// Handle Redis connection events
redisClient.on('connect', () => {
    console.log('Redis client connected');
});
redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
});
// Connect to Redis
(async () => {
    try {
        await redisClient.connect();
    }
    catch (error) {
        console.error('Failed to connect to Redis:', error);
    }
})();
exports.default = redisClient;
