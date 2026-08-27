import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenBlacklistService } from './token-blacklist.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      // JWT_SECRET проверяется на старте в validateRequiredEnv() — здесь он гарантированно задан
      secret: process.env.JWT_SECRET as string,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as `${number}d` },
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenBlacklistService],
  exports: [JwtModule],
})
export class AuthModule {}
