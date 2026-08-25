import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ListingStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { ModerateListingDto } from './dto/moderate-listing.dto';

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
  constructor(private readonly prisma: PrismaService) {}

  async findPublished(query: QueryListingsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.PUBLISHED,
      ...(query.category ? { category: { slug: query.category } } : {}),
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
    return this.prisma.listing.update({
      where: { id: listing.id },
      data: dto,
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

    return this.prisma.listing.update({
      where: { id },
      data:
        dto.action === 'approve'
          ? { status: ListingStatus.PUBLISHED, rejectionReason: null }
          : { status: ListingStatus.REJECTED, rejectionReason: dto.reason },
      include: LISTING_INCLUDE,
    });
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
