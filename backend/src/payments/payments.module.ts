import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { YooKassaService } from './yookassa.service';

@Module({
  imports: [SettingsModule],
  providers: [YooKassaService],
  exports: [YooKassaService],
})
export class PaymentsModule {}
