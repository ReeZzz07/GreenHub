import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { createTransport } from 'nodemailer';
import { SettingsService } from '../settings/settings.service';
import { createQueueRedisConnection } from '../queue/redis-connection';
import { EMAIL_QUEUE } from '../queue/queue.tokens';

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

// SMTP-креды хранятся в SystemSetting (как ЮKassa/Plant.id/LLM) и вводятся админом через /admin/settings.
// Пока хост не настроен, отправка молча пропускается — это не должно ломать основной флоу (заказ, модерацию, чат).
//
// Отправка идёт через очередь BullMQ (TZ.md 2.2: "отправка email/push" — фоновая задача): вызывающий код
// (NotificationsService) кладёт письмо в очередь через enqueue() и не ждёт ответа SMTP; воркер ниже
// обрабатывает очередь в этом же процессе и ретраит транзиентные сбои с экспоненциальной паузой.
@Injectable()
export class MailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  private worker!: Worker<SendMailInput>;

  constructor(
    private readonly settings: SettingsService,
    @Inject(EMAIL_QUEUE) private readonly queue: Queue<SendMailInput>,
  ) {}

  onModuleInit() {
    this.worker = new Worker<SendMailInput>(
      EMAIL_QUEUE,
      (job) => this.sendNow(job.data),
      { connection: createQueueRedisConnection() },
    );
    this.worker.on('failed', (job, error) => {
      this.logger.error(`Письмо "${job?.data.subject}" для ${job?.data.to} не отправлено после всех попыток`, error);
    });
  }

  async onModuleDestroy() {
    await this.worker.close();
  }

  async enqueue(input: SendMailInput): Promise<void> {
    await this.queue.add('send', input, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: 50,
    });
  }

  private async sendNow({ to, subject, html }: SendMailInput): Promise<void> {
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
  }
}
