import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { YooKassaService } from '../payments/yookassa.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: {
    subscriptionPlan: { findUnique: jest.Mock };
    subscription: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
  };
  let yooKassa: { createPayment: jest.Mock; getPayment: jest.Mock };

  const plan = { id: 'plan-1', name: 'Питомник Стандарт', price: 1990, durationDays: 30, isActive: true };

  beforeEach(async () => {
    prisma = {
      subscriptionPlan: { findUnique: jest.fn() },
      subscription: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    };
    yooKassa = { createPayment: jest.fn(), getPayment: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: YooKassaService, useValue: yooKassa },
      ],
    }).compile();

    service = moduleRef.get(SubscriptionsService);
  });

  describe('subscribe', () => {
    it('rejects an unknown plan', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue(null);
      await expect(service.subscribe('seller-1', { planId: 'missing' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a deactivated plan', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue({ ...plan, isActive: false });
      await expect(service.subscribe('seller-1', { planId: plan.id })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('requests a YooKassa payment for the plan price with a saved payment method', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue(plan);
      yooKassa.createPayment.mockResolvedValue({
        id: 'payment-1',
        confirmation: { confirmation_url: 'https://yookassa.ru/pay/1' },
      });
      prisma.subscription.create.mockImplementation(({ data }) => data);

      const subscription = await service.subscribe('seller-1', { planId: plan.id });

      expect(yooKassa.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({ amount: plan.price, savePaymentMethod: true }),
      );
      expect(subscription.status).toBe(SubscriptionStatus.PENDING);
      expect(subscription.paymentUrl).toBe('https://yookassa.ru/pay/1');
    });
  });

  describe('handleWebhook', () => {
    const pendingSubscription = { id: 'sub-1', status: SubscriptionStatus.PENDING, planId: plan.id };

    it('returns false when no subscription matches the payment id', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);
      await expect(service.handleWebhook('unknown')).resolves.toBe(false);
    });

    it('activates a pending subscription and sets expiresAt from the plan duration once payment succeeds', async () => {
      prisma.subscription.findUnique.mockResolvedValue(pendingSubscription);
      prisma.subscriptionPlan.findUnique.mockResolvedValue(plan);
      yooKassa.getPayment.mockResolvedValue({ status: 'succeeded' });

      const before = Date.now();
      await service.handleWebhook('payment-1');
      const after = Date.now();

      const updateCall = prisma.subscription.update.mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: 'sub-1' });
      expect(updateCall.data.status).toBe(SubscriptionStatus.ACTIVE);
      const expiresAt: Date = updateCall.data.expiresAt;
      const expectedMin = before + 29 * 24 * 60 * 60 * 1000;
      const expectedMax = after + 31 * 24 * 60 * 60 * 1000;
      expect(expiresAt.getTime()).toBeGreaterThan(expectedMin);
      expect(expiresAt.getTime()).toBeLessThan(expectedMax);
    });

    it('does not re-activate a subscription that is already active (idempotent webhook replay)', async () => {
      prisma.subscription.findUnique.mockResolvedValue({ ...pendingSubscription, status: SubscriptionStatus.ACTIVE });
      yooKassa.getPayment.mockResolvedValue({ status: 'succeeded' });

      await service.handleWebhook('payment-1');

      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('cancels a pending subscription when YooKassa reports a cancellation', async () => {
      prisma.subscription.findUnique.mockResolvedValue(pendingSubscription);
      yooKassa.getPayment.mockResolvedValue({ status: 'canceled' });

      await service.handleWebhook('payment-1');

      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: SubscriptionStatus.CANCELLED },
      });
    });
  });
});
