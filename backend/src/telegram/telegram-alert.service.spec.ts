import { Test } from '@nestjs/testing';
import { TelegramAlertService } from './telegram-alert.service';
import { SettingsService } from '../settings/settings.service';

describe('TelegramAlertService', () => {
  let service: TelegramAlertService;
  let settings: { get: jest.Mock };
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    settings = { get: jest.fn() };
    fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;

    const moduleRef = await Test.createTestingModule({
      providers: [TelegramAlertService, { provide: SettingsService, useValue: settings }],
    }).compile();

    service = moduleRef.get(TelegramAlertService);
  });

  it('does nothing when the bot token or chat id is not configured', async () => {
    settings.get.mockResolvedValue(null);
    await service.notifyError('GET /api/orders', 'boom');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts to the Telegram Bot API with the configured chat id once both settings are present', async () => {
    settings.get.mockImplementation((key: string) => (key === 'TELEGRAM_BOT_TOKEN' ? 'bot-token' : '-100123'));

    await service.notifyError('GET /api/orders', 'boom');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telegram.org/botbot-token/sendMessage',
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.chat_id).toBe('-100123');
    expect(body.text).toContain('GET /api/orders');
    expect(body.text).toContain('boom');
  });

  it('does not send the same alert again within the cooldown window', async () => {
    settings.get.mockImplementation((key: string) => (key === 'TELEGRAM_BOT_TOKEN' ? 'bot-token' : '-100123'));

    await service.notifyError('GET /api/orders', 'boom');
    await service.notifyError('GET /api/orders', 'boom');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never throws when the Telegram API call itself fails', async () => {
    settings.get.mockImplementation((key: string) => (key === 'TELEGRAM_BOT_TOKEN' ? 'bot-token' : '-100123'));
    fetchMock.mockRejectedValue(new Error('network error'));

    await expect(service.notifyError('GET /api/orders', 'boom')).resolves.toBeUndefined();
  });
});
