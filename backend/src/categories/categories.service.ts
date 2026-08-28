import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: { children: { orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true },
    });
    if (!category) throw new NotFoundException('Категория не найдена');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    await this.assertSlugFree(dto.slug);
    if (dto.parentId) await this.findOne(dto.parentId);
    return this.prisma.category.create({ data: dto });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    if (dto.slug) await this.assertSlugFree(dto.slug, id);
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Категория не может быть родителем самой себе');
      }
      await this.findOne(dto.parentId);
    }
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    if (category.children.length > 0) {
      throw new BadRequestException('Сначала удалите или перенесите подкатегории этой категории');
    }
    const listingsCount = await this.prisma.listing.count({ where: { categoryId: id } });
    if (listingsCount > 0) {
      throw new BadRequestException('Нельзя удалить категорию, в которой есть объявления');
    }
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  private async assertSlugFree(slug: string, excludeId?: string) {
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Категория с таким slug уже существует');
    }
  }
}
