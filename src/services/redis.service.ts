import { createClient, RedisClientType } from 'redis';
import config from '../config/config';

// Create Redis client
const redisClient: RedisClientType = createClient({
  url: `redis://${config.redisConfig.password ? config.redisConfig.password + '@' : ''}${config.redisConfig.host}:${config.redisConfig.port}`,
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
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
})();

export default redisClient;