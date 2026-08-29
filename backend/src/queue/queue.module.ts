import { Global, Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import { createQueueRedisConnection } from './redis-connection';
import { AI_RECOGNIZE_QUEUE, AI_DESCRIPTION_QUEUE, IMAGE_WATERMARK_QUEUE, EMAIL_QUEUE } from './queue.tokens';

const QUEUE_NAMES = [AI_RECOGNIZE_QUEUE, AI_DESCRIPTION_QUEUE, IMAGE_WATERMARK_QUEUE, EMAIL_QUEUE];

const queueProviders = QUEUE_NAMES.map((name) => ({
  provide: name,
  useFactory: () => new Queue(name, { connection: createQueueRedisConnection() }),
}));

// Global — как PrismaModule/RedisModule/NotificationsModule: очереди-продюсеры доступны
// любому модулю через @Inject(AI_RECOGNIZE_QUEUE) и т.п. без добавления в imports.
@Global()
@Module({
  providers: [...queueProviders],
  exports: QUEUE_NAMES,
})
export class QueueModule {}
