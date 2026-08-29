import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { YooKassaService } from '../payments/yookassa.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

const SUBSCRIPTION_INCLUDE = { plan: true } as const;

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly yooKassa: YooKassaService,
  ) {}

  findMine(sellerId: string) {
    return this.prisma.subscription.findFirst({
      where: { sellerId },
      include: SUBSCRIPTION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async subscribe(sellerId: string, dto: CreateSubscriptionDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: dto.planId } });
    if (!plan || !plan.isActive) throw new NotFoundException('Тариф не найден');

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    // save_payment_method — платформа готовит сохранённый способ оплаты для будущих переоформлений,
    // но автосписание по расписанию не реализовано (см. комментарий у модели Subscription в schema.prisma).
    const payment = await this.yooKassa.createPayment({
      amount: plan.price,
      description: `GreenHub: подписка «${plan.name}»`,
      returnUrl: `${frontendUrl}/subscription`,
      savePaymentMethod: true,
    });

    return this.prisma.subscription.create({
      data: {
        planId: plan.id,
        sellerId,
        status: SubscriptionStatus.PENDING,
        paymentId: payment.id,
        paymentUrl: payment.confirmation?.confirmation_url,
      },
      include: SUBSCRIPTION_INCLUDE,
    });
  }

  // Вебхук не доверяет статусу из тела запроса — перепроверяет через GET к самой ЮKassa,
  // тот же паттерн, что и у заказов (см. OrdersService.handleWebhook).
  async handleWebhook(paymentId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({ where: { paymentId } });
    if (!subscription) return false;

    const verified = await this.yooKassa.getPayment(paymentId);
    if (verified.status === 'succeeded' && subscription.status === SubscriptionStatus.PENDING) {
      const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: subscription.planId } });
      const expiresAt = new Date(Date.now() + (plan?.durationDays ?? 30) * 24 * 60 * 60 * 1000);
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.ACTIVE, expiresAt },
      });
    } else if (verified.status === 'canceled' && subscription.status === SubscriptionStatus.PENDING) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.CANCELLED },
      });
    }
    return true;
  }
}
