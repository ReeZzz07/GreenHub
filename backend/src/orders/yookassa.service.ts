import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SettingsService } from '../settings/settings.service';

const API_BASE = 'https://api.yookassa.ru/v3';

export interface YooKassaPayment {
  id: string;
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  confirmation?: { confirmation_url?: string };
}

interface Credentials {
  shopId: string;
  secretKey: string;
}

// Клиент ЮKassa REST API v3 (https://yookassa.ru/developers/api).
// Не протестирован против боевого API — ключей нет; логика повторяет документированный контракт 1-в-1,
// проверить нужно будет, как только администратор добавит реальные shopId/secretKey через /admin/settings.
@Injectable()
export class YooKassaService {
  constructor(private readonly settings: SettingsService) {}

  async isConfigured(): Promise<boolean> {
    const creds = await this.getCredentials();
    return creds !== null;
  }

  private async getCredentials(): Promise<Credentials | null> {
    const [shopId, secretKey] = await Promise.all([
      this.settings.get('YOOKASSA_SHOP_ID'),
      this.settings.get('YOOKASSA_SECRET_KEY'),
    ]);
    if (!shopId || !secretKey) return null;
    return { shopId, secretKey };
  }

  private async request<T>(path: string, init: RequestInit & { idempotent?: boolean } = {}): Promise<T> {
    const creds = await this.getCredentials();
    if (!creds) {
      throw new ServiceUnavailableException(
        'Платежи через ЮKassa не настроены — обратитесь к администратору',
      );
    }

    const auth = Buffer.from(`${creds.shopId}:${creds.secretKey}`).toString('base64');
    const headers: Record<string, string> = {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    };
    if (init.idempotent) {
      headers['Idempotence-Key'] = randomUUID();
    }

    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    if (!res.ok) {
      const body = await res.text();
      throw new ServiceUnavailableException(`Ошибка ЮKassa (${res.status}): ${body}`);
    }
    return res.json();
  }

  createPayment(params: { amount: number; description: string; returnUrl: string }): Promise<YooKassaPayment> {
    return this.request<YooKassaPayment>('/payments', {
      method: 'POST',
      idempotent: true,
      body: JSON.stringify({
        amount: { value: params.amount.toFixed(2), currency: 'RUB' },
        confirmation: { type: 'redirect', return_url: params.returnUrl },
        capture: true,
        description: params.description,
      }),
    });
  }

  getPayment(paymentId: string): Promise<YooKassaPayment> {
    return this.request<YooKassaPayment>(`/payments/${paymentId}`, { method: 'GET' });
  }
}
