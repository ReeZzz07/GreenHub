import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: RedisClientType;

  async onModuleInit() {
    this.client = createClient({ url: process.env.REDIS_URL });
    this.client.on('error', (error) => this.logger.error('Redis connection error', error));
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async setWithTtl(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return;
    await this.client.set(key, value, { EX: ttlSeconds });
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }
}
