import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ListingStatus, NotificationType, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';

const REVIEWER_SELECT = { id: true, name: true, avatarUrl: true } as const;

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(orderId: string, buyerId: string, dto: CreateReviewDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { listing: { select: { sellerId: true, title: true } } },
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    if (order.buyerId !== buyerId) throw new ForbiddenException('Нет доступа к этому заказу');
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Отзыв можно оставить только после оплаты заказа');
    }

    const existing = await this.prisma.review.findUnique({ where: { orderId } });
    if (existing) throw new ConflictException('Отзыв на этот заказ уже оставлен');

    const review = await this.prisma.review.create({
      data: {
        orderId,
        reviewerId: buyerId,
        sellerId: order.listing.sellerId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: { reviewer: { select: REVIEWER_SELECT } },
    });

    await this.notifications.create(
      order.listing.sellerId,
      NotificationType.NEW_REVIEW,
      'Новый отзыв',
      `${review.reviewer.name} оставил отзыв (${dto.rating}★) о «${order.listing.title}»`,
      `/seller/${order.listing.sellerId}?tab=reviews`,
    );

    return review;
  }

  async reply(reviewId: string, sellerId: string, dto: ReplyReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Отзыв не найден');
    if (review.sellerId !== sellerId) throw new ForbiddenException('Нет доступа к этому отзыву');
    if (review.sellerReply) throw new BadRequestException('Ответ на этот отзыв уже добавлен');

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { sellerReply: dto.reply },
      include: { reviewer: { select: REVIEWER_SELECT } },
    });

    await this.notifications.create(
      review.reviewerId,
      NotificationType.REVIEW_REPLY,
      'Продавец ответил на ваш отзыв',
      dto.reply,
      `/orders/${review.orderId}`,
    );

    return updated;
  }

  findForSeller(sellerId: string) {
    return this.prisma.review.findMany({
      where: { sellerId },
      include: { reviewer: { select: REVIEWER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSellerSummary(sellerId: string) {
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, name: true, avatarUrl: true, role: true, createdAt: true },
    });
    if (!seller) throw new NotFoundException('Продавец не найден');

    const [reviews, listingsCount, soldCount] = await Promise.all([
      this.prisma.review.findMany({ where: { sellerId }, select: { rating: true } }),
      this.prisma.listing.count({ where: { sellerId, status: ListingStatus.PUBLISHED } }),
      this.prisma.order.count({ where: { status: OrderStatus.PAID, listing: { sellerId } } }),
    ]);
    const reviewsCount = reviews.length;
    const avgRating = reviewsCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount : 0;
    const breakdown = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));

    return { ...seller, avgRating, reviewsCount, breakdown, listingsCount, soldCount };
  }
}
