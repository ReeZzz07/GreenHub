import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const LISTING_INCLUDE = {
  category: true,
  seller: { select: { id: true, name: true } },
} as const;

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: { listing: { include: LISTING_INCLUDE } },
      orderBy: { createdAt: 'desc' },
    });
    return favorites.map((f) => f.listing);
  }

  async findMineIds(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { listingId: true },
    });
    return favorites.map((f) => f.listingId);
  }

  async add(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Объявление не найдено');

    await this.prisma.favorite.upsert({
      where: { userId_listingId: { userId, listingId } },
      update: {},
      create: { userId, listingId },
    });
    return { success: true };
  }

  async remove(userId: string, listingId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, listingId } });
    return { success: true };
  }
}
