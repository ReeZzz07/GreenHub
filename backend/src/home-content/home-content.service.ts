import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateHomeContentDto } from './dto/update-home-content.dto';

const SINGLETON_ID = 'default';

// Дефолт совпадает с тем, что раньше было зашито прямо в JSX главной страницы —
// пока админ ничего не поменял, сайт выглядит ровно как раньше.
export const DEFAULT_HOME_CONTENT: UpdateHomeContentDto = {
  heroBanner: {
    title: 'Растения от продавцов напрямую',
    ctaText: 'Смотреть каталог',
  },
  recognizeBanner: {
    badgeText: 'AI-распознавание',
    title: 'Не знаете это растение?',
    description: 'Сфотографируйте — определим вид за секунды и подберём похожие в каталоге',
    ctaText: 'Распознать',
  },
  featuresTitle: 'Почему GreenHub?',
  features: [
    {
      title: 'Растения с инструкцией по уходу',
      description: 'У каждого товара — рекомендации по поливу и освещению',
      icon: 'droplet',
      iconType: 'PRESET',
    },
    {
      title: 'Удобная оплата',
      description: 'Оплачивайте заказами через платежные ссылки',
      icon: 'wallet',
      iconType: 'PRESET',
    },
    {
      title: 'Проверенные продавцы',
      description: 'Рейтинг и отзывы покупателей у каждого продавца',
      icon: 'star',
      iconType: 'PRESET',
    },
  ],
  howItWorksTitle: 'Как это работает',
  steps: [
    { title: 'Найдите растение', description: 'Ищите в каталоге по названию или фильтрам — либо сфотографируйте' },
    { title: 'Напишите продавцу', description: 'Уточните детали напрямую в чате внутри платформы' },
    { title: 'Купите напрямую', description: 'Оплата по безопасной ссылке, без посредников' },
  ],
  newArrivalsTitle: 'Новые поступления',
  closingCta: {
    title: 'Продаёте растения?',
    description: 'Разместите объявление бесплатно — оно появится в каталоге сразу после проверки',
    buttonText: 'Разместить объявление',
  },
};

@Injectable()
export class HomeContentService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<UpdateHomeContentDto> {
    const row = await this.prisma.homePageContent.findUnique({ where: { id: SINGLETON_ID } });
    if (!row) return DEFAULT_HOME_CONTENT;
    return row.content as unknown as UpdateHomeContentDto;
  }

  async update(dto: UpdateHomeContentDto, updatedBy: string): Promise<UpdateHomeContentDto> {
    await this.prisma.homePageContent.upsert({
      where: { id: SINGLETON_ID },
      update: { content: dto as object, updatedBy },
      create: { id: SINGLETON_ID, content: dto as object, updatedBy },
    });
    return dto;
  }
}
