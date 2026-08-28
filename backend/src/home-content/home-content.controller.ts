import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
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
import { MediaService } from '../media/media.service';
import { HomeContentService } from './home-content.service';
import { UpdateHomeContentDto } from './dto/update-home-content.dto';

const MAX_ICON_SIZE = 5 * 1024 * 1024; // 5 МБ, как и для остальной загрузки фото (TZ.md)

@Controller('home-content')
export class HomeContentController {
  constructor(
    private readonly homeContentService: HomeContentService,
    private readonly mediaService: MediaService,
  ) {}

  // Публичный — им пользуется главная страница для всех посетителей, не только авторизованных
  @Get()
  get() {
    return this.homeContentService.get();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch()
  update(@Body() dto: UpdateHomeContentDto, @CurrentUser() user: { id: string }) {
    return this.homeContentService.update(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('icon')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_ICON_SIZE } }))
  async uploadIcon(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }
    const url = await this.mediaService.uploadSmallIcon(file, 'home-content-icons');
    return { url };
  }
}
