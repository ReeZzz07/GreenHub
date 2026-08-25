import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SETTING_KEYS, SettingKey } from './setting-keys';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: SettingKey): Promise<string | null> {
    const row = await this.prisma.systemSetting.findUnique({ where: { key } });
    return row?.value || null;
  }

  async getStatus(): Promise<Record<SettingKey, boolean>> {
    const rows = await this.prisma.systemSetting.findMany({
      where: { key: { in: [...SETTING_KEYS] } },
    });
    const configured = new Set(rows.filter((r) => r.value).map((r) => r.key));
    return Object.fromEntries(
      SETTING_KEYS.map((key) => [key, configured.has(key)]),
    ) as Record<SettingKey, boolean>;
  }

  async set(updates: Partial<Record<SettingKey, string>>, updatedBy: string) {
    const entries = Object.entries(updates).filter(([, value]) => value !== undefined && value !== '');
    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.systemSetting.upsert({
          where: { key },
          update: { value: value as string, updatedBy },
          create: { key, value: value as string, updatedBy },
        }),
      ),
    );
    return this.getStatus();
  }
}
