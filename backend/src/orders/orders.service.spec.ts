import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationType, OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { YooKassaService } from '../payments/yookassa.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: {
    listing: { findUnique: jest.Mock };
    order: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
  };
  let yooKassa: { createPayment: jest.Mock; getPayment: jest.Mock };
  let notifications: { create: jest.Mock };

  const listing = { id: 'listing-1', title: 'Монстера', price: 1000, sellerId: 'seller-1' };

  beforeEach(async () => {
    prisma = {
      listing: { findUnique: jest.fn() },
      order: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    };
    yooKassa = { createPayment: jest.fn(), getPayment: jest.fn() };
    notifications = { create: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: YooKassaService, useValue: yooKassa },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  describe('create', () => {
    it('rejects buying your own listing', async () => {
      prisma.listing.findUnique.mockResolvedValue(listing);

      await expect(service.create('seller-1', { listingId: listing.id })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(yooKassa.createPayment).not.toHaveBeenCalled();
    });

    it('throws when the listing does not exist', async () => {
      prisma.listing.findUnique.mockResolvedValue(null);

      await expect(service.create('buyer-1', { listingId: 'missing' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('charges price × quantity and stores the YooKassa payment link', async () => {
      prisma.listing.findUnique.mockResolvedValue(listing);
      yooKassa.createPayment.mockResolvedValue({
        id: 'payment-1',
        confirmation: { confirmation_url: 'https://yookassa.ru/pay/1' },
      });
      prisma.order.create.mockImplementation(({ data }) => data);

      const order = await service.create('buyer-1', { listingId: listing.id, quantity: 3 });

      expect(yooKassa.createPayment.mock.calls[0][0].amount).toBe(3000);
      expect(order.amount).toBe(3000);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.paymentUrl).toBe('https://yookassa.ru/pay/1');
    });
  });

  describe('findOne', () => {
    const order = { id: 'order-1', buyerId: 'buyer-1', listing: { sellerId: 'seller-1' } };

    it('throws when the order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing', 'buyer-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a user who is neither the buyer nor the seller', async () => {
      prisma.order.findUnique.mockResolvedValue(order);
      await expect(service.findOne(order.id, 'stranger')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows the seller to view the order', async () => {
      prisma.order.findUnique.mockResolvedValue(order);
      await expect(service.findOne(order.id, 'seller-1')).resolves.toBe(order);
    });
  });

  describe('handleWebhook', () => {
    const pendingOrder = {
      id: 'order-1',
      status: OrderStatus.PENDING,
      amount: 1000,
      buyerId: 'buyer-1',
      listing: { title: 'Монстера', sellerId: 'seller-1' },
    };

    it('returns false when no order matches the payment id', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.handleWebhook('unknown-payment')).resolves.toBe(false);
      expect(yooKassa.getPayment).not.toHaveBeenCalled();
    });

    it('does not touch the order or notify anyone when the verified status is unchanged', async () => {
      prisma.order.findUnique.mockResolvedValue(pendingOrder);
      yooKassa.getPayment.mockResolvedValue({ status: 'pending' });

      await service.handleWebhook('payment-1');

      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(notifications.create).not.toHaveBeenCalled();
    });

    it('marks the order PAID and notifies both buyer and seller once YooKassa confirms success', async () => {
      prisma.order.findUnique.mockResolvedValue(pendingOrder);
      yooKassa.getPayment.mockResolvedValue({ status: 'succeeded' });

      await service.handleWebhook('payment-1');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: pendingOrder.id },
        data: { status: OrderStatus.PAID },
      });
      expect(notifications.create).toHaveBeenCalledTimes(2);
      const recipients = notifications.create.mock.calls.map((call) => call[0]);
      expect(recipients).toEqual(expect.arrayContaining(['seller-1', 'buyer-1']));
      notifications.create.mock.calls.forEach((call) => expect(call[1]).toBe(NotificationType.ORDER_PAID));
    });

    it('marks the order CANCELLED and notifies both parties when YooKassa reports a cancellation', async () => {
      prisma.order.findUnique.mockResolvedValue(pendingOrder);
      yooKassa.getPayment.mockResolvedValue({ status: 'canceled' });

      await service.handleWebhook('payment-1');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: pendingOrder.id },
        data: { status: OrderStatus.CANCELLED },
      });
      expect(notifications.create).toHaveBeenCalledTimes(2);
      notifications.create.mock.calls.forEach((call) => expect(call[1]).toBe(NotificationType.ORDER_CANCELLED));
    });
  });
});
