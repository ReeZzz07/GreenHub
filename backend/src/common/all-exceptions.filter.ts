import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { TelegramAlertService } from '../telegram/telegram-alert.service';

// Глобальный фильтр (main.ts) — не меняет тело/код ответа (Nest сам формирует их для HttpException,
// для остальных — 500 Internal Server Error, как и без фильтра), только добавляет побочный эффект:
// на 5xx шлёт best-effort алерт в Telegram (TZ.md 2.2). 4xx (валидация, 401/403/404 и т.п.) — это
// ожидаемые клиентские ошибки, ими алерты не спамим.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('UnhandledException');

  constructor(private readonly telegramAlert: TelegramAlertService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : { statusCode: status, message: 'Internal server error' };

    if (status >= 500) {
      const message = exception instanceof Error ? (exception.stack ?? exception.message) : String(exception);
      this.logger.error(message);
      this.telegramAlert.notifyError(`${request.method} ${request.url}`, message).catch(() => undefined);
    }

    response.status(status).json(body);
  }
}
