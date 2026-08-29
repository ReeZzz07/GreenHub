import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AiJobsService } from './ai-jobs.service';
import { AI_RECOGNIZE_QUEUE, AI_DESCRIPTION_QUEUE } from '../queue/queue.tokens';
import { PlantIdService } from './plant-id.service';
import { LlmService } from './llm.service';
import { ContentModerationService } from './content-moderation.service';

// onModuleInit (which spins up real BullMQ Workers against Redis) is never invoked here — Nest's
// TestingModule only calls lifecycle hooks if you explicitly run moduleRef.init(), which this suite
// deliberately doesn't, so only the pure submit/status logic below is under test.
describe('AiJobsService', () => {
  let service: AiJobsService;
  let recognizeQueue: { add: jest.Mock; getJob: jest.Mock };
  let descriptionQueue: { add: jest.Mock; getJob: jest.Mock };

  beforeEach(async () => {
    recognizeQueue = { add: jest.fn(), getJob: jest.fn() };
    descriptionQueue = { add: jest.fn(), getJob: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AiJobsService,
        { provide: AI_RECOGNIZE_QUEUE, useValue: recognizeQueue },
        { provide: AI_DESCRIPTION_QUEUE, useValue: descriptionQueue },
        { provide: PlantIdService, useValue: {} },
        { provide: LlmService, useValue: {} },
        { provide: ContentModerationService, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(AiJobsService);
  });

  describe('submitRecognize', () => {
    it('enqueues the image as base64 tagged with the submitting user', async () => {
      recognizeQueue.add.mockResolvedValue({ id: 'job-1' });

      const jobId = await service.submitRecognize('user-1', Buffer.from('fake-image-bytes'));

      expect(jobId).toBe('job-1');
      const [, data] = recognizeQueue.add.mock.calls[0];
      expect(data.userId).toBe('user-1');
      expect(Buffer.from(data.imageBase64, 'base64').toString()).toBe('fake-image-bytes');
    });
  });

  describe('getRecognizeStatus', () => {
    it("refuses to reveal another user's job", async () => {
      recognizeQueue.getJob.mockResolvedValue({ data: { userId: 'owner-1' } });
      await expect(service.getRecognizeStatus('job-1', 'someone-else')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('reports a missing job the same way as a foreign one (no existence leak)', async () => {
      recognizeQueue.getJob.mockResolvedValue(undefined);
      await expect(service.getRecognizeStatus('missing', 'user-1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('reports pending while the job is still queued/active', async () => {
      recognizeQueue.getJob.mockResolvedValue({ data: { userId: 'user-1' }, getState: async () => 'active' });
      await expect(service.getRecognizeStatus('job-1', 'user-1')).resolves.toEqual({ status: 'pending' });
    });

    it('returns the result once the job has completed', async () => {
      const result = { recognized: true, name: 'Monstera deliciosa', commonNames: [], confidence: 0.9 };
      recognizeQueue.getJob.mockResolvedValue({
        data: { userId: 'user-1' },
        getState: async () => 'completed',
        returnvalue: result,
      });
      await expect(service.getRecognizeStatus('job-1', 'user-1')).resolves.toEqual({
        status: 'completed',
        result,
      });
    });

    it('surfaces the failure reason when the job failed', async () => {
      recognizeQueue.getJob.mockResolvedValue({
        data: { userId: 'user-1' },
        getState: async () => 'failed',
        failedReason: 'Plant.id недоступен',
      });
      await expect(service.getRecognizeStatus('job-1', 'user-1')).resolves.toEqual({
        status: 'failed',
        error: 'Plant.id недоступен',
      });
    });
  });

  describe('submitDescription / getDescriptionStatus', () => {
    it('enqueues the description input tagged with the submitting user', async () => {
      descriptionQueue.add.mockResolvedValue({ id: 'job-2' });
      const input = { title: 'Монстера', categoryName: 'Комнатные' };

      const jobId = await service.submitDescription('user-1', input);

      expect(jobId).toBe('job-2');
      expect(descriptionQueue.add).toHaveBeenCalledWith('generate', { userId: 'user-1', input }, expect.any(Object));
    });

    it("refuses to reveal another user's description job", async () => {
      descriptionQueue.getJob.mockResolvedValue({ data: { userId: 'owner-1' } });
      await expect(service.getDescriptionStatus('job-2', 'someone-else')).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
