import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import { ModerateVerificationDto } from './dto/moderate-verification.dto';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 МБ, как и для остальной загрузки фото (TZ.md)

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Get('verification-queue')
  findVerificationQueue() {
    return this.usersService.findVerificationQueue();
  }

  @Post('me/change-password')
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: { id: string }) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Post('me/email-change-request')
  requestEmailChange(@Body() dto: RequestEmailChangeDto, @CurrentUser() user: { id: string }) {
    return this.usersService.requestEmailChange(user.id, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_AVATAR_SIZE } }))
  uploadAvatar(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: { id: string }) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }
    return this.usersService.uploadAvatar(user.id, file);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Patch(':id/moderate-verification')
  moderateVerification(@Param('id') id: string, @Body() dto: ModerateVerificationDto) {
    return this.usersService.moderateVerification(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
