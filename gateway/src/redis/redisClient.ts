import Redis from 'ioredis';

let redisInstance: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisInstance) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisInstance = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }
  return redisInstance;
};

export const setRedisClient = (client: Redis): void => {
  redisInstance = client;
};
