import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlantIdService } from './plant-id.service';
import { AiRateLimiterService } from './ai-rate-limiter.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ, как и для /media/upload (TZ.md)

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly plantId: PlantIdService,
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
}
