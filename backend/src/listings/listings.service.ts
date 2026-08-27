import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ListingStatus, NotificationType, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { ModerateListingDto } from './dto/moderate-listing.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

interface RequestUser {
  id: string;
  role: UserRole;
}

const LISTING_INCLUDE = {
  category: true,
  seller: { select: { id: true, name: true } },
} satisfies Prisma.ListingInclude;

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findPublished(query: QueryListingsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.PUBLISHED,
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.sellerId ? { sellerId: query.sellerId } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? { price: { gte: query.minPrice, lte: query.maxPrice } }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { latinName: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ListingOrderByWithRelationInput =
      query.sortBy === 'price_asc'
        ? { price: 'asc' }
        : query.sortBy === 'price_desc'
          ? { price: 'desc' }
          : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: LISTING_INCLUDE,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findPublishedById(id: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id, status: ListingStatus.PUBLISHED },
    });
    if (!listing) throw new NotFoundException('Объявление не найдено');

    return this.prisma.listing.update({
      where: { id: listing.id },
      data: { views: { increment: 1 } },
      include: LISTING_INCLUDE,
    });
  }

  async findSimilar(id: string, limit = 6) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { categoryId: true },
    });
    if (!listing) return [];

    return this.prisma.listing.findMany({
      where: { status: ListingStatus.PUBLISHED, categoryId: listing.categoryId, id: { not: id } },
      include: LISTING_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByIdForModerator(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: LISTING_INCLUDE,
    });
    if (!listing) throw new NotFoundException('Объявление не найдено');
    return listing;
  }

  findMine(sellerId: string) {
    return this.prisma.listing.findMany({
      where: { sellerId },
      include: LISTING_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  findModerationQueue() {
    return this.prisma.listing.findMany({
      where: { status: ListingStatus.PENDING_MODERATION },
      include: LISTING_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  }

  create(sellerId: string, dto: CreateListingDto) {
    return this.prisma.listing.create({
      data: {
        title: dto.title,
        latinName: dto.latinName,
        description: dto.description,
        price: dto.price,
        quantity: dto.quantity ?? 1,
        images: dto.images ?? [],
        lightRequirements: dto.lightRequirements,
        waterRequirements: dto.waterRequirements,
        careInstructions: dto.careInstructions ?? [],
        categoryId: dto.categoryId,
        sellerId,
      },
      include: LISTING_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateListingDto, requester: RequestUser) {
    const listing = await this.getOwnedOrThrow(id, requester);

    // Правки уже опубликованного/отклонённого объявления уходят на повторную модерацию —
    // иначе продавец мог бы одобренным объявлением подменить фото/описание на что угодно.
    const needsReModeration =
      requester.role !== UserRole.ADMIN &&
      (listing.status === ListingStatus.PUBLISHED || listing.status === ListingStatus.REJECTED);

    return this.prisma.listing.update({
      where: { id: listing.id },
      data: {
        ...dto,
        ...(needsReModeration ? { status: ListingStatus.PENDING_MODERATION, rejectionReason: null } : {}),
      },
      include: LISTING_INCLUDE,
    });
  }

  async updateAvailability(id: string, dto: UpdateAvailabilityDto, requester: RequestUser) {
    const listing = await this.getOwnedOrThrow(id, requester);

    if (dto.action === 'mark_sold') {
      if (listing.status !== ListingStatus.PUBLISHED) {
        throw new BadRequestException('Пометить проданным можно только опубликованное объявление');
      }
      return this.prisma.listing.update({
        where: { id },
        data: { status: ListingStatus.SOLD },
        include: LISTING_INCLUDE,
      });
    }

    if (listing.status !== ListingStatus.SOLD) {
      throw new BadRequestException('Вернуть в продажу можно только проданное объявление');
    }
    return this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.PUBLISHED },
      include: LISTING_INCLUDE,
    });
  }

  async remove(id: string, requester: RequestUser) {
    const listing = await this.getOwnedOrThrow(id, requester);
    await this.prisma.listing.delete({ where: { id: listing.id } });
    return { success: true };
  }

  async moderate(id: string, dto: ModerateListingDto) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Объявление не найдено');

    const updated = await this.prisma.listing.update({
      where: { id },
      data:
        dto.action === 'approve'
          ? { status: ListingStatus.PUBLISHED, rejectionReason: null }
          : { status: ListingStatus.REJECTED, rejectionReason: dto.reason },
      include: LISTING_INCLUDE,
    });

    if (dto.action === 'approve') {
      await this.notifications.create(
        listing.sellerId,
        NotificationType.LISTING_APPROVED,
        'Объявление опубликовано',
        `«${listing.title}» прошло модерацию и уже доступно в каталоге`,
        `/plant/${id}`,
      );
    } else {
      await this.notifications.create(
        listing.sellerId,
        NotificationType.LISTING_REJECTED,
        'Объявление отклонено',
        dto.reason ? `«${listing.title}»: ${dto.reason}` : `«${listing.title}» не прошло модерацию`,
        '/listings/mine',
      );
    }

    return updated;
  }

  private async getOwnedOrThrow(id: string, requester: RequestUser) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Объявление не найдено');
    if (listing.sellerId !== requester.id && requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Нет доступа к этому объявлению');
    }
    return listing;
  }
}
