import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

// Экспозиция метрик в формате Prometheus (TZ.md 2.2 — "Мониторинг: Prometheus/Grafana").
// collectDefaultMetrics даёт стандартные process/CPU/heap-метрики "из коробки";
// httpRequests* — наши собственные, пишутся из MetricsMiddleware на каждый HTTP-запрос.
@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Общее количество HTTP-запросов',
    labelNames: ['method', 'route', 'status_code'] as const,
    registers: [this.registry],
  });

  readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Длительность обработки HTTP-запроса в секундах',
    labelNames: ['method', 'route', 'status_code'] as const,
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
