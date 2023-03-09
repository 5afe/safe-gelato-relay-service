import { Global, Module } from '@nestjs/common';
import { LoggingService, RequestScopedLoggingService } from './logging.service';

@Global()
@Module({
  providers: [
    { provide: LoggingService, useClass: RequestScopedLoggingService },
  ],
  exports: [LoggingService],
})
export class RequestScopedLoggingModule {}
