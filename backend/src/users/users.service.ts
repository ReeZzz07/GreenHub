import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole, UserVerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import { ModerateVerificationDto } from './dto/moderate-verification.dto';

const PUBLIC_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  avatarUrl: true,
  pendingEmail: true,
  verificationStatus: true,
  rejectionReason: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  findAll() {
    return this.prisma.user.findMany({ select: PUBLIC_SELECT });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: PUBLIC_SELECT });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, requester: { id: string; role: UserRole }) {
    if (requester.id !== id && requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Нет доступа к редактированию этого пользователя');
    }
    await this.findOne(id);
    // Имя/телефон — не чувствительные поля, применяются сразу, без модерации
    return this.prisma.user.update({ where: { id }, data: dto, select: PUBLIC_SELECT });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!matches) {
      throw new BadRequestException('Текущий пароль указан неверно');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { success: true };
  }

  async uploadAvatar(userId: string, file: { buffer: Buffer; mimetype: string }) {
    const url = await this.mediaService.uploadAvatar(file, userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
      select: PUBLIC_SELECT,
    });
  }

  // Email — логин пользователя, поэтому смена не применяется сразу: новое значение ждёт
  // в pendingEmail до одобрения модератором/админом (TZ.md, модель модерации объявлений — та же идея)
  async requestEmailChange(userId: string, dto: RequestEmailChangeDto) {
    const user = await this.findOne(userId);
    if (dto.newEmail === user.email) {
      throw new BadRequestException('Это ваш текущий email');
    }

    const taken = await this.prisma.user.findUnique({ where: { email: dto.newEmail } });
    if (taken) {
      throw new ConflictException('Этот email уже используется другим аккаунтом');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        pendingEmail: dto.newEmail,
        verificationStatus: UserVerificationStatus.PENDING_MODERATION,
        rejectionReason: null,
      },
      select: PUBLIC_SELECT,
    });
  }

  findVerificationQueue() {
    return this.prisma.user.findMany({
      where: { verificationStatus: UserVerificationStatus.PENDING_MODERATION },
      select: PUBLIC_SELECT,
      orderBy: { updatedAt: 'asc' },
    });
  }

  async moderateVerification(userId: string, dto: ModerateVerificationDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    if (user.verificationStatus !== UserVerificationStatus.PENDING_MODERATION || !user.pendingEmail) {
      throw new BadRequestException('У пользователя нет заявки на смену email');
    }

    if (dto.action === 'approve') {
      const taken = await this.prisma.user.findUnique({ where: { email: user.pendingEmail } });
      if (taken && taken.id !== userId) {
        throw new ConflictException('Этот email уже занят — попросите пользователя выбрать другой');
      }
      return this.prisma.user.update({
        where: { id: userId },
        data: {
          email: user.pendingEmail,
          pendingEmail: null,
          verificationStatus: UserVerificationStatus.VERIFIED,
          rejectionReason: null,
        },
        select: PUBLIC_SELECT,
      });
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        pendingEmail: null,
        verificationStatus: UserVerificationStatus.VERIFIED,
        rejectionReason: dto.reason,
      },
      select: PUBLIC_SELECT,
    });
  }
}
