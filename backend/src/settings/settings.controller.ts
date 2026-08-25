import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

// Настройки интеграций (ЮKassa, Plant.id, LLM) — доступны и изменяемы только администратором.
// Значения ключей никогда не возвращаются клиенту, только флаг "настроено/нет".
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getStatus() {
    return this.settingsService.getStatus();
  }

  @Patch()
  update(@Body() dto: UpdateSettingsDto, @CurrentUser() user: { id: string }) {
    return this.settingsService.set(dto, user.id);
  }
}
