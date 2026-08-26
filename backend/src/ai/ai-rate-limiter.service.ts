import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_HOUR = 5; // TZ.md, раздел 4.4 — общий лимит на распознавание и генерацию описаний

// Простой in-memory счётчик — переживает один процесс, не переживает рестарт и не шарится между
// инстансами. Для MVP-масштаба этого достаточно; при горизонтальном масштабировании нужно
// перенести счётчик в Redis (он уже есть в инфраструктуре для чата).
@Injectable()
export class AiRateLimiterService {
  private readonly requestsByUser = new Map<string, number[]>();

  checkAndRecord(userId: string): void {
    const now = Date.now();
    const recent = (this.requestsByUser.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);

    if (recent.length >= MAX_REQUESTS_PER_HOUR) {
      throw new HttpException(
        'Превышен лимит запросов к AI (5 в час). Попробуйте позже.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    this.requestsByUser.set(userId, recent);
  }
}
