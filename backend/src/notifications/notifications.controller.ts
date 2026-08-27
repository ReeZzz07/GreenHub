import { Controller, Get, HttpCode, HttpStatus, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  findMine(@CurrentUser() user: { id: string }) {
    return this.notifications.findForUser(user.id);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: { id: string }) {
    return { count: await this.notifications.countUnread(user.id) };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() user: { id: string }) {
    return this.notifications.markAllRead(user.id);
  }

  @Patch('conversations/:conversationId/read')
  @HttpCode(HttpStatus.OK)
  markConversationRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notifications.markConversationRead(user.id, conversationId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.notifications.markRead(id, user.id);
  }
}
