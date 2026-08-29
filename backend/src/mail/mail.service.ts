import { Injectable, Logger } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { SettingsService } from '../settings/settings.service';

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

// SMTP-креды хранятся в SystemSetting (как ЮKassa/Plant.id/LLM) и вводятся админом через /admin/settings.
// Пока хост не настроен, отправка молча пропускается — это не должно ломать основной флоу (заказ, модерацию, чат).
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly settings: SettingsService) {}

  async send({ to, subject, html }: SendMailInput): Promise<void> {
    const [host, port, user, password, from, secure] = await Promise.all([
      this.settings.get('SMTP_HOST'),
      this.settings.get('SMTP_PORT'),
      this.settings.get('SMTP_USER'),
      this.settings.get('SMTP_PASSWORD'),
      this.settings.get('SMTP_FROM'),
      this.settings.get('SMTP_SECURE'),
    ]);

    if (!host) {
      this.logger.debug(`SMTP не настроен — письмо "${subject}" для ${to} не отправлено`);
      return;
    }

    try {
      const transport = createTransport({
        host,
        port: port ? Number(port) : 587,
        secure: secure === 'true',
        auth: user ? { user, pass: password ?? '' } : undefined,
      });
      await transport.sendMail({
        from: from || user || 'GreenHub <no-reply@greenhub.local>',
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(`Не удалось отправить письмо "${subject}" для ${to}`, error instanceof Error ? error.stack : error);
    }
  }
}
