import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const RECENT_LIMIT = 30;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Внутренний метод для других сервисов (чат, модерация, заказы, отзывы) — не эндпоинт.
  create(userId: string, type: NotificationType, title: string, message: string, link?: string) {
    return this.prisma.notification.create({
      data: { userId, type, title, message, link },
    });
  }

  findForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: RECENT_LIMIT,
    });
  }

  countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Уведомление не найдено');
    if (notification.userId !== userId) throw new ForbiddenException('Нет доступа к этому уведомлению');

    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return { success: true };
  }

  // Открыв чат, пользователь уже прочитал сообщение — гасим уведомление о нём, чтобы не дублировать индикатор.
  async markConversationRead(userId: string, conversationId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, type: NotificationType.NEW_MESSAGE, link: `/chats/${conversationId}`, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }
}
