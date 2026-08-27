import { Test } from '@nestjs/testing';
import { TokenBlacklistService } from './token-blacklist.service';
import { RedisService } from '../redis/redis.service';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  let redis: { setWithTtl: jest.Mock; exists: jest.Mock };

  beforeEach(async () => {
    redis = { setWithTtl: jest.fn(), exists: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [TokenBlacklistService, { provide: RedisService, useValue: redis }],
    }).compile();

    service = moduleRef.get(TokenBlacklistService);
  });

  it('stores the jti with a TTL matching the remaining token lifetime', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    await service.revoke('some-jti', nowSeconds + 100);

    expect(redis.setWithTtl).toHaveBeenCalledWith('revoked-jwt:some-jti', '1', expect.any(Number));
    const [, , ttl] = redis.setWithTtl.mock.calls[0];
    expect(ttl).toBeGreaterThan(90);
    expect(ttl).toBeLessThanOrEqual(100);
  });

  it('reports a jti as revoked once it was stored', async () => {
    redis.exists.mockResolvedValue(true);
    await expect(service.isRevoked('some-jti')).resolves.toBe(true);
    expect(redis.exists).toHaveBeenCalledWith('revoked-jwt:some-jti');
  });

  it('reports a jti as not revoked when Redis has no record for it', async () => {
    redis.exists.mockResolvedValue(false);
    await expect(service.isRevoked('other-jti')).resolves.toBe(false);
  });
});
