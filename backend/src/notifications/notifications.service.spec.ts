import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: {
    notification: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
    user: { findUnique: jest.Mock };
  };
  let mail: { enqueue: jest.Mock };

  beforeEach(async () => {
    prisma = {
      notification: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
      user: { findUnique: jest.fn() },
    };
    mail = { enqueue: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mail },
      ],
    }).compile();

    service = moduleRef.get(NotificationsService);
  });

  describe('markRead', () => {
    it('throws when the notification does not exist', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);
      await expect(service.markRead('missing', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it("rejects marking another user's notification as read", async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'owner-1' });
      await expect(service.markRead('n1', 'someone-else')).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it('marks the notification read for its owner', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'owner-1' });
      prisma.notification.update.mockResolvedValue({ id: 'n1', isRead: true });

      await service.markRead('n1', 'owner-1');

      expect(prisma.notification.update).toHaveBeenCalledWith({ where: { id: 'n1' }, data: { isRead: true } });
    });
  });

  describe('create', () => {
    it('persists the notification and queues an email to the recipient', async () => {
      prisma.notification.create.mockResolvedValue({ id: 'n1' });
      prisma.user.findUnique.mockResolvedValue({ email: 'buyer@example.com', name: 'Buyer' });

      await service.create('user-1', NotificationType.ORDER_PAID, 'Заказ оплачен', 'Спасибо за покупку', '/orders/1');
      // sendEmail() is fired without awaiting inside create() — flush microtasks so we can assert on it.
      await Promise.resolve();
      await Promise.resolve();

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', type: NotificationType.ORDER_PAID, title: 'Заказ оплачен', message: 'Спасибо за покупку', link: '/orders/1' },
      });
      expect(mail.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'buyer@example.com', subject: 'Заказ оплачен' }),
      );
    });

    it('does not queue an email when the recipient user cannot be found', async () => {
      prisma.notification.create.mockResolvedValue({ id: 'n1' });
      prisma.user.findUnique.mockResolvedValue(null);

      await service.create('ghost-user', NotificationType.ORDER_PAID, 'Title', 'Message');
      await Promise.resolve();
      await Promise.resolve();

      expect(mail.enqueue).not.toHaveBeenCalled();
    });
  });
});
