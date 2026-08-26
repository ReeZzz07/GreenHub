import {
  BadRequestException,
  Body,
  Controller,
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
import { PlantIdService } from './plant-id.service';
import { LlmService } from './llm.service';
import { ContentModerationService } from './content-moderation.service';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import { GenerateDescriptionDto } from './dto/generate-description.dto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ, как и для /media/upload (TZ.md)
const SELLER_ROLES = [UserRole.SELLER_INDIVIDUAL, UserRole.SELLER_BUSINESS, UserRole.ADMIN];

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly plantId: PlantIdService,
    private readonly llm: LlmService,
    private readonly moderation: ContentModerationService,
    private readonly rateLimiter: AiRateLimiterService,
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

    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const suggestion = await this.plantId.identify(dataUrl);

    if (!suggestion) {
      return { recognized: false };
    }

    return {
      recognized: true,
      name: suggestion.name,
      commonNames: suggestion.commonNames,
      confidence: suggestion.probability,
    };
  }

  @UseGuards(RolesGuard)
  @Roles(...SELLER_ROLES)
  @Post('generate-description')
  async generateDescription(
    @Body() dto: GenerateDescriptionDto,
    @CurrentUser() user: { id: string },
  ) {
    this.rateLimiter.checkAndRecord(user.id);

    const description = await this.llm.generateDescription(dto);
    const { clean, reasons } = this.moderation.check(description);

    return { description, flagged: !clean, flagReasons: reasons };
  }
}
