import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CONVERSATION_INCLUDE = {
  listing: { select: { id: true, title: true, images: true, price: true, sellerId: true } },
  buyer: { select: { id: true, name: true } },
  seller: { select: { id: true, name: true } },
} as const;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateConversation(buyerId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Объявление не найдено');
    if (listing.sellerId === buyerId) {
      throw new BadRequestException('Нельзя написать самому себе по своему же объявлению');
    }

    const existing = await this.prisma.conversation.findUnique({
      where: { listingId_buyerId: { listingId, buyerId } },
      include: CONVERSATION_INCLUDE,
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: { listingId, buyerId, sellerId: listing.sellerId },
      include: CONVERSATION_INCLUDE,
    });
  }

  findMine(userId: string) {
    return this.prisma.conversation.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: {
        ...CONVERSATION_INCLUDE,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async assertParticipant(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: CONVERSATION_INCLUDE,
    });
    if (!conversation) throw new NotFoundException('Чат не найден');
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      throw new ForbiddenException('Нет доступа к этому чату');
    }
    return conversation;
  }

  async findMessages(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    return this.prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    await this.assertParticipant(conversationId, senderId);

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId, senderId, content },
        include: { sender: { select: { id: true, name: true } } },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return message;
  }
}
