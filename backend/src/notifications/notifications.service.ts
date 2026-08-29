import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

const RECENT_LIMIT = 30;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  // Внутренний метод для других сервисов (чат, модерация, заказы, отзывы) — не эндпоинт.
  async create(userId: string, type: NotificationType, title: string, message: string, link?: string) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, message, link },
    });
    // Письмо ставится в очередь (MailService.enqueue) и никогда не блокирует создание уведомления.
    this.sendEmail(userId, title, message, link).catch(() => undefined);
    return notification;
  }

  private async sendEmail(userId: string, title: string, message: string, link?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (!user) return;

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const url = `${frontendUrl}${link ?? ''}`;
    await this.mail.enqueue({
      to: user.email,
      subject: title,
      html: `<p>Здравствуйте, ${user.name}!</p><p>${message}</p><p><a href="${url}">Перейти в GreenHub</a></p>`,
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
