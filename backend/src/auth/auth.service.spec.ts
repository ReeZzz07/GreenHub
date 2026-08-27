import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TokenBlacklistService } from './token-blacklist.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
  let jwt: { sign: jest.Mock };
  let tokenBlacklist: { revoke: jest.Mock };

  const baseUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.BUYER,
    phone: null,
    avatarUrl: null,
    pendingEmail: null,
    verificationStatus: 'VERIFIED',
  };

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };
    jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };
    tokenBlacklist = { revoke: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: TokenBlacklistService, useValue: tokenBlacklist },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('rejects registration when the email is already taken', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      await expect(
        service.register({
          email: baseUser.email,
          password: 'password123',
          name: 'Another Name',
          role: UserRole.BUYER,
          consentToDataProcessing: true,
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('hashes the password and records consent before creating the user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ ...baseUser, passwordHash: 'hashed' });

      await service.register({
        email: baseUser.email,
        password: 'password123',
        name: baseUser.name,
        role: UserRole.BUYER,
        consentToDataProcessing: true,
      });

      const createArgs = prisma.user.create.mock.calls[0][0];
      expect(createArgs.data.passwordHash).not.toBe('password123');
      expect(await bcrypt.compare('password123', createArgs.data.passwordHash)).toBe(true);
      expect(createArgs.data.consentToDataProcessingAt).toBeInstanceOf(Date);
    });

    it('returns a signed access token on successful registration', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(baseUser);

      const result = await service.register({
        email: baseUser.email,
        password: 'password123',
        name: baseUser.name,
        role: UserRole.BUYER,
        consentToDataProcessing: true,
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user.email).toBe(baseUser.email);
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'nope@example.com', password: 'whatever' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects a wrong password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });

      await expect(service.login({ email: baseUser.email, password: 'wrong-password' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('signs a token with a fresh jti on successful login', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });

      await service.login({ email: baseUser.email, password: 'correct-password' });

      const signedPayload = jwt.sign.mock.calls[0][0];
      expect(signedPayload.sub).toBe(baseUser.id);
      expect(typeof signedPayload.jti).toBe('string');
      expect(signedPayload.jti.length).toBeGreaterThan(0);
    });
  });

  describe('logout', () => {
    it('delegates to the token blacklist with the jti and expiry from the current token', async () => {
      await service.logout('some-jti', 123456);
      expect(tokenBlacklist.revoke).toHaveBeenCalledWith('some-jti', 123456);
    });
  });
});
