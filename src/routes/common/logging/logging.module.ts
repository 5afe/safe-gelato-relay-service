import { Global, Module } from '@nestjs/common';
import { LoggingService } from './logging.interface';
import { RequestScopedLoggingService } from './logging.service';

/**
 * Module for logging messages throughout the application.
 *
 * Provides the RequestScopedLoggingService which logs the current time and request ID with every message.
 */
@Global()
@Module({
  providers: [
    { provide: LoggingService, useClass: RequestScopedLoggingService },
  ],
  exports: [LoggingService],
})
export class RequestScopedLoggingModule {}
