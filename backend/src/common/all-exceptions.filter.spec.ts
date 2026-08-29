import { ArgumentsHost, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { TelegramAlertService } from '../telegram/telegram-alert.service';

function makeHost(method = 'GET', url = '/api/whatever') {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method, url }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  let telegramAlert: { notifyError: jest.Mock };
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    telegramAlert = { notifyError: jest.fn().mockResolvedValue(undefined) };
    filter = new AllExceptionsFilter(telegramAlert as unknown as TelegramAlertService);
  });

  it('passes a 4xx HttpException through untouched and does not alert', () => {
    const { host, status, json } = makeHost();
    filter.catch(new BadRequestException('Bad input'), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Bad input' }));
    expect(telegramAlert.notifyError).not.toHaveBeenCalled();
  });

  it('alerts once on a 5xx HttpException, without changing the response', () => {
    const { host, status, json } = makeHost('POST', '/api/orders');
    filter.catch(new InternalServerErrorException('DB is down'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: 'DB is down' }));
    expect(telegramAlert.notifyError).toHaveBeenCalledTimes(1);
    expect(telegramAlert.notifyError.mock.calls[0][0]).toBe('POST /api/orders');
  });

  it('treats a raw (non-HttpException) error as a 500 and alerts', () => {
    const { host, status } = makeHost();
    filter.catch(new Error('unexpected crash'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(telegramAlert.notifyError).toHaveBeenCalledTimes(1);
    expect(telegramAlert.notifyError.mock.calls[0][1]).toContain('unexpected crash');
  });

  it('never lets a Telegram delivery failure break the HTTP response', () => {
    telegramAlert.notifyError.mockRejectedValue(new Error('Telegram unreachable'));
    const { host, status } = makeHost();

    expect(() => filter.catch(new Error('boom'), host)).not.toThrow();
    expect(status).toHaveBeenCalledWith(500);
  });
});
