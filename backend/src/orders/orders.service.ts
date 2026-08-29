import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationType, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { YooKassaService } from './yookassa.service';
import { CreateOrderDto } from './dto/create-order.dto';

const ORDER_INCLUDE = {
  listing: { select: { id: true, title: true, images: true, sellerId: true } },
  review: true,
} as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly yooKassa: YooKassaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(buyerId: string, dto: CreateOrderDto) {
    const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
    if (!listing) throw new NotFoundException('Объявление не найдено');
    if (listing.sellerId === buyerId) {
      throw new BadRequestException('Нельзя купить собственное объявление');
    }

    const quantity = dto.quantity ?? 1;
    const amount = listing.price * quantity;

    // Сначала запрашиваем платёж у ЮKassa и только при успехе создаём заказ —
    // иначе при недоступности/ошибке ЮKassa в базе остаются "заказы-сироты" без ссылки на оплату.
    const id = randomUUID();
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const payment = await this.yooKassa.createPayment({
      amount,
      description: `GreenHub: ${listing.title} × ${quantity}`,
      returnUrl: `${frontendUrl}/orders/${id}`,
    });

    return this.prisma.order.create({
      data: {
        id,
        listingId: listing.id,
        buyerId,
        quantity,
        amount,
        status: OrderStatus.PENDING,
        paymentId: payment.id,
        paymentUrl: payment.confirmation?.confirmation_url,
      },
      include: ORDER_INCLUDE,
    });
  }

  findMine(buyerId: string) {
    return this.prisma.order.findMany({
      where: { buyerId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!order) throw new NotFoundException('Заказ не найден');
    if (order.buyerId !== userId && order.listing.sellerId !== userId) {
      throw new ForbiddenException('Нет доступа к этому заказу');
    }
    return order;
  }

  // Вебхук не доверяет статусу из тела запроса напрямую — перепроверяет его через GET-запрос
  // к самой ЮKassa (рекомендованная практика их API, т.к. базовый v3 API не подписывает уведомления).
  async handleWebhook(paymentId: string) {
    const order = await this.prisma.order.findUnique({
      where: { paymentId },
      include: { listing: { select: { title: true, sellerId: true } } },
    });
    if (!order) return;

    const verified = await this.yooKassa.getPayment(paymentId);
    const status =
      verified.status === 'succeeded'
        ? OrderStatus.PAID
        : verified.status === 'canceled'
          ? OrderStatus.CANCELLED
          : order.status;

    if (status !== order.status) {
      await this.prisma.order.update({ where: { id: order.id }, data: { status } });

      if (status === OrderStatus.PAID) {
        await Promise.all([
          this.notifications.create(
            order.listing.sellerId,
            NotificationType.ORDER_PAID,
            'Новый оплаченный заказ',
            `«${order.listing.title}» — оплачено на сумму ${order.amount.toLocaleString('ru-RU')} ₽`,
            `/orders/${order.id}`,
          ),
          this.notifications.create(
            order.buyerId,
            NotificationType.ORDER_PAID,
            'Заказ оплачен',
            `Оплата заказа «${order.listing.title}» прошла успешно`,
            `/orders/${order.id}`,
          ),
        ]);
      } else if (status === OrderStatus.CANCELLED) {
        await Promise.all([
          this.notifications.create(
            order.listing.sellerId,
            NotificationType.ORDER_CANCELLED,
            'Заказ отменён',
            `Заказ «${order.listing.title}» отменён`,
            `/orders/${order.id}`,
          ),
          this.notifications.create(
            order.buyerId,
            NotificationType.ORDER_CANCELLED,
            'Заказ отменён',
            `Ваш заказ «${order.listing.title}» отменён`,
            `/orders/${order.id}`,
          ),
        ]);
      }
    }
  }
}
