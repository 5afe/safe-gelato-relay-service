import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import {
  ILoggingService,
  LoggingService,
} from '../routes/common/logging/logging.interface';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(LoggingService) private readonly loggingService: ILoggingService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    res.on('finish', () => {
      const { statusCode } = res;
      const responseMessage: [string, number] = ['[<==] %d', res.statusCode];
      if (statusCode < 400) {
        this.loggingService.info(...responseMessage);
      } else if (statusCode >= 400 && statusCode < 500) {
        this.loggingService.warn(...responseMessage);
      } else {
        this.loggingService.error(...responseMessage);
      }
    });

    next();
  }
}
