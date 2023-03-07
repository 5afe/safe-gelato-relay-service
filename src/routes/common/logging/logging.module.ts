import { Global, Module } from '@nestjs/common';
import { RequestScopedLoggingService } from './logging.service';

@Global()
@Module({
  providers: [RequestScopedLoggingService],
  exports: [RequestScopedLoggingService],
})
export class RequestScopedLoggingModule {}
