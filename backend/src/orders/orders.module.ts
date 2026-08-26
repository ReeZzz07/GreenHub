import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { YooKassaService } from './yookassa.service';

@Module({
  imports: [SettingsModule],
  controllers: [OrdersController],
  providers: [OrdersService, YooKassaService],
})
export class OrdersModule {}
