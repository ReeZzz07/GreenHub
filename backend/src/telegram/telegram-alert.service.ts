import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

const COOLDOWN_MS = 5 * 60 * 1000; // не шлём один и тот же алерт чаще раза в 5 минут — защита от флуда при повторяющейся ошибке

// Алерты об ошибках бэкенда в Telegram (TZ.md 2.2). Креды — как SMTP/ЮKassa/Plant.id/LLM —
// вводятся администратором через /admin/settings, пока не настроены — молча ничего не отправляем.
@Injectable()
export class TelegramAlertService {
  private readonly logger = new Logger(TelegramAlertService.name);
  private readonly lastSentAt = new Map<string, number>();

  constructor(private readonly settings: SettingsService) {}

  async notifyError(context: string, message: string): Promise<void> {
    const dedupeKey = `${context}:${message}`.slice(0, 200);
    const last = this.lastSentAt.get(dedupeKey) ?? 0;
    if (Date.now() - last < COOLDOWN_MS) return;

    const [token, chatId] = await Promise.all([
      this.settings.get('TELEGRAM_BOT_TOKEN'),
      this.settings.get('TELEGRAM_CHAT_ID'),
    ]);
    if (!token || !chatId) return;

    this.lastSentAt.set(dedupeKey, Date.now());

    const text = `⚠️ GreenHub backend error\n\n${context}\n\n${message}`.slice(0, 4000);
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      if (!res.ok) {
        this.logger.warn(`Telegram API вернул ${res.status} при отправке алерта`);
      }
    } catch (error) {
      // Алерт — best-effort: сбой отправки не должен ронять запрос, который его инициировал.
      this.logger.warn('Не удалось отправить Telegram-алерт', error instanceof Error ? error.message : error);
    }
  }
}
