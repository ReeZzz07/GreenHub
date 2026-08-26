import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { AiController } from './ai.controller';
import { PlantIdService } from './plant-id.service';
import { AiRateLimiterService } from './ai-rate-limiter.service';

@Module({
  imports: [SettingsModule],
  controllers: [AiController],
  providers: [PlantIdService, AiRateLimiterService],
})
export class AiModule {}
