import IORedis from 'ioredis';

// BullMQ требует ioredis (не совместим с клиентом `redis`, который используют RedisService/чат) —
// отдельное соединение специально под очереди. maxRetriesPerRequest: null обязателен для Worker'ов BullMQ.
export function createQueueRedisConnection(): IORedis {
  return new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });
}
