import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import { AiJobsService } from './ai-jobs.service';
import { GenerateDescriptionDto } from './dto/generate-description.dto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ, как и для /media/upload (TZ.md)
const SELLER_ROLES = [UserRole.SELLER_INDIVIDUAL, UserRole.SELLER_BUSINESS, UserRole.ADMIN];

// Оба эндпоинта отдают только jobId — сама обработка идёт в фоновой очереди (см. AiJobsService).
// Клиент получает результат через GET .../:jobId (поллингом).
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly rateLimiter: AiRateLimiterService,
    private readonly aiJobs: AiJobsService,
  ) {}

  @Post('recognize')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  async recognize(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: { id: string }) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      throw new BadRequestException('Допустимые форматы изображений: JPG, PNG');
    }

    this.rateLimiter.checkAndRecord(user.id);

    const jobId = await this.aiJobs.submitRecognize(user.id, file.buffer);
    return { jobId };
  }

  @Get('recognize/:jobId')
  async recognizeStatus(@Param('jobId') jobId: string, @CurrentUser() user: { id: string }) {
    return this.aiJobs.getRecognizeStatus(jobId, user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(...SELLER_ROLES)
  @Post('generate-description')
  async generateDescription(
    @Body() dto: GenerateDescriptionDto,
    @CurrentUser() user: { id: string },
  ) {
    this.rateLimiter.checkAndRecord(user.id);

    const jobId = await this.aiJobs.submitDescription(user.id, dto);
    return { jobId };
  }

  @Get('generate-description/:jobId')
  async generateDescriptionStatus(@Param('jobId') jobId: string, @CurrentUser() user: { id: string }) {
    return this.aiJobs.getDescriptionStatus(jobId, user.id);
  }
}
