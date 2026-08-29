import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './chat/redis-io.adapter';
import { validateRequiredEnv } from './config/env.validation';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { TelegramAlertService } from './telegram/telegram-alert.service';

async function bootstrap() {
  validateRequiredEnv();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter(app.get(TelegramAlertService)));

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  app.get(Logger).log(`GreenHub API running on http://localhost:${port}/api`);
}

bootstrap();
