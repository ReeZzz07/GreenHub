import { Global, Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { TelegramAlertService } from './telegram-alert.service';

// Global — как MailModule: AllExceptionsFilter (глобальный, вне DI-графа конкретного модуля)
// получает TelegramAlertService через app.get() в main.ts, поэтому провайдер должен быть доступен
// на уровне корневого инжектора.
@Global()
@Module({
  imports: [SettingsModule],
  providers: [TelegramAlertService],
  exports: [TelegramAlertService],
})
export class TelegramModule {}
