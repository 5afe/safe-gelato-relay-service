import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RequestScopedLoggingService } from 'src/routes/common/logging/logging.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly loggingService: RequestScopedLoggingService) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.loggingService.debug('[==>] %s %s', req.method, req.url);

    const contentLength = res.get('content-length') || '';
    const contentType = res.get('content-type') || '';

    const responseMessage: [string, number, string, string] = [
      '[<==] %d %s %s',
      res.statusCode,
      contentLength,
      contentType,
    ];

    res.on('finish', () => {
      const { statusCode } = res;
      if (statusCode < 400) {
        this.loggingService.log(...responseMessage);
      } else if (statusCode >= 400 && statusCode < 500) {
        this.loggingService.warn(...responseMessage);
      } else this.loggingService.error(...responseMessage);
    });

    next();
  }
}
