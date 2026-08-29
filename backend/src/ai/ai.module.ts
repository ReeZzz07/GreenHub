import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { AiController } from './ai.controller';
import { PlantIdService } from './plant-id.service';
import { LlmService } from './llm.service';
import { ContentModerationService } from './content-moderation.service';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import { AiJobsService } from './ai-jobs.service';

@Module({
  imports: [SettingsModule],
  controllers: [AiController],
  providers: [PlantIdService, LlmService, ContentModerationService, AiRateLimiterService, AiJobsService],
})
export class AiModule {}
