import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

// Базовый ThrottlerGuard достаёт req/res через context.switchToHttp(), что ломается на
// WebSocket-обработчиках чата (там нет res.header()). Глобально лимитируем только HTTP.
@Injectable()
export class HttpThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    return context.getType() !== 'http';
  }
}
