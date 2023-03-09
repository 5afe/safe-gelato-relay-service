import { Global, Module, LoggerService } from '@nestjs/common';

import { LoggingService } from '../logging.service';

const loggerService: LoggerService = {
  log: function (message: any, ...optionalParams: any[]) {
    console.log(message, ...optionalParams);
  },
  error: function (message: any, ...optionalParams: any[]) {
    console.error(message, ...optionalParams);
  },
  warn: function (message: any, ...optionalParams: any[]) {
    console.warn(message, ...optionalParams);
  },
};

export const mockLoggerService = jest.mocked(loggerService);

@Global()
@Module({
  providers: [{ provide: LoggingService, useValue: mockLoggerService }],
  exports: [LoggingService],
})
export class TestLoggingModule {}
