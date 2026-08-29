import { ForbiddenException, Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { createQueueRedisConnection } from '../queue/redis-connection';
import { AI_RECOGNIZE_QUEUE, AI_DESCRIPTION_QUEUE } from '../queue/queue.tokens';
import { PlantIdService } from './plant-id.service';
import { LlmService, DescriptionInput } from './llm.service';
import { ContentModerationService } from './content-moderation.service';

interface RecognizeJobData {
  userId: string;
  imageBase64: string;
}

export interface RecognizeJobResult {
  recognized: boolean;
  name?: string;
  commonNames?: string[];
  confidence?: number;
}

interface DescriptionJobData {
  userId: string;
  input: DescriptionInput;
}

export interface DescriptionJobResult {
  description: string;
  flagged: boolean;
  flagReasons: string[];
}

export type JobStatusResponse<T> =
  | { status: 'pending' }
  | { status: 'completed'; result: T }
  | { status: 'failed'; error: string };

const JOB_OPTS = { attempts: 2, backoff: { type: 'exponential' as const, delay: 2000 }, removeOnComplete: 200, removeOnFail: 200 };

// Распознавание растения (Plant.id) и генерация описания (LLM) — обе задачи зовут внешние API
// без ограничения по времени (см. PlantIdService/LlmService), поэтому вынесены в BullMQ (TZ.md 2.2,
// "ИИ-обработка"): контроллер сразу отдаёт jobId, а результат клиент получает через поллинг
// GET .../:jobId (см. AiController). Воркеры работают в этом же процессе — см. пояснение в queue.tokens.ts.
@Injectable()
export class AiJobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiJobsService.name);
  private recognizeWorker!: Worker<RecognizeJobData>;
  private descriptionWorker!: Worker<DescriptionJobData>;

  constructor(
    @Inject(AI_RECOGNIZE_QUEUE) private readonly recognizeQueue: Queue<RecognizeJobData>,
    @Inject(AI_DESCRIPTION_QUEUE) private readonly descriptionQueue: Queue<DescriptionJobData>,
    private readonly plantId: PlantIdService,
    private readonly llm: LlmService,
    private readonly moderation: ContentModerationService,
  ) {}

  onModuleInit() {
    this.recognizeWorker = new Worker<RecognizeJobData>(
      AI_RECOGNIZE_QUEUE,
      async (job): Promise<RecognizeJobResult> => {
        const buffer = Buffer.from(job.data.imageBase64, 'base64');
        const suggestion = await this.plantId.identify(buffer);
        if (!suggestion) return { recognized: false };
        return {
          recognized: true,
          name: suggestion.name,
          commonNames: suggestion.commonNames,
          confidence: suggestion.probability,
        };
      },
      { connection: createQueueRedisConnection() },
    );
    this.recognizeWorker.on('failed', (job, error) =>
      this.logger.error(`Job распознавания ${job?.id} провалился`, error),
    );

    this.descriptionWorker = new Worker<DescriptionJobData>(
      AI_DESCRIPTION_QUEUE,
      async (job): Promise<DescriptionJobResult> => {
        const description = await this.llm.generateDescription(job.data.input);
        const { clean, reasons } = this.moderation.check(description);
        return { description, flagged: !clean, flagReasons: reasons };
      },
      { connection: createQueueRedisConnection() },
    );
    this.descriptionWorker.on('failed', (job, error) =>
      this.logger.error(`Job генерации описания ${job?.id} провалился`, error),
    );
  }

  async onModuleDestroy() {
    await this.recognizeWorker?.close();
    await this.descriptionWorker?.close();
  }

  async submitRecognize(userId: string, imageBuffer: Buffer): Promise<string> {
    const job = await this.recognizeQueue.add(
      'recognize',
      { userId, imageBase64: imageBuffer.toString('base64') },
      JOB_OPTS,
    );
    return job.id!;
  }

  async getRecognizeStatus(jobId: string, userId: string): Promise<JobStatusResponse<RecognizeJobResult>> {
    const job = await this.recognizeQueue.getJob(jobId);
    return this.readJobStatus(job, userId);
  }

  async submitDescription(userId: string, input: DescriptionInput): Promise<string> {
    const job = await this.descriptionQueue.add('generate', { userId, input }, JOB_OPTS);
    return job.id!;
  }

  async getDescriptionStatus(jobId: string, userId: string): Promise<JobStatusResponse<DescriptionJobResult>> {
    const job = await this.descriptionQueue.getJob(jobId);
    return this.readJobStatus(job, userId);
  }

  private async readJobStatus<T>(
    job: { data: { userId: string }; getState: () => Promise<string>; returnvalue: T; failedReason?: string } | undefined,
    userId: string,
  ): Promise<JobStatusResponse<T>> {
    if (!job || job.data.userId !== userId) {
      // Не раскрываем существование чужой задачи — просто "ещё не готово".
      throw new ForbiddenException('Задача не найдена');
    }

    const state = await job.getState();
    if (state === 'completed') return { status: 'completed', result: job.returnvalue };
    if (state === 'failed') return { status: 'failed', error: job.failedReason ?? 'Не удалось выполнить запрос' };
    return { status: 'pending' };
  }
}
