import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

// Публичный эндпоинт — как и у большинства Prometheus-экспортеров, доступ ограничивается
// на уровне сети (внутренний scrape, не проксируется наружу), а не JWT.
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetrics(): Promise<string> {
    return this.metrics.getMetrics();
  }
}
