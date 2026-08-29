import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (req.path === '/api/metrics') {
      next();
      return;
    }

    const stopTimer = this.metrics.httpRequestDuration.startTimer();
    res.on('finish', () => {
      // req.route?.path — параметризованный путь ("/listings/:id"), а не конкретный id —
      // иначе с каждым уникальным id плодился бы отдельный ряд метрики (высокая кардинальность).
      const route = (req.route?.path as string | undefined) ?? req.path;
      const labels = { method: req.method, route, status_code: String(res.statusCode) };
      this.metrics.httpRequestsTotal.inc(labels);
      stopTimer(labels);
    });

    next();
  }
}
