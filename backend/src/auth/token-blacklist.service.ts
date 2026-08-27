import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

// JWT — самодостаточный токен, отозвать его штатно нельзя. Чтобы logout() и смена роли
// реально инвалидировали старый токен (а не просто чистили его на клиенте), кладём jti
// отозванного токена в Redis до истечения его собственного срока действия.
@Injectable()
export class TokenBlacklistService {
  constructor(private readonly redis: RedisService) {}

  private key(jti: string): string {
    return `revoked-jwt:${jti}`;
  }

  async revoke(jti: string, expiresAt: number): Promise<void> {
    const ttlSeconds = expiresAt - Math.floor(Date.now() / 1000);
    await this.redis.setWithTtl(this.key(jti), '1', ttlSeconds);
  }

  async isRevoked(jti: string): Promise<boolean> {
    return this.redis.exists(this.key(jti));
  }
}
