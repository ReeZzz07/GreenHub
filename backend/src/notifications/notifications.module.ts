import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

// Global — как PrismaModule/RedisModule: другие модули (чат, объявления, заказы, отзывы)
// просто инжектят NotificationsService, не добавляя его в свои imports.
@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
