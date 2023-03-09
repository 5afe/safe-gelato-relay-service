import { Global, Module } from '@nestjs/common';
import { ILoggingService, LoggingService } from '../logging.interface';

const loggerService: ILoggingService = {
  log: function (message: any, ...optionalParams: any[]) {
    console.log(message, ...optionalParams);
  },
  error: function (message: any, ...optionalParams: any[]) {
    console.error(message, ...optionalParams);
  },
  warn: function (message: any, ...optionalParams: any[]) {
    console.warn(message, ...optionalParams);
  },
  debug: function (message: string, ...optionalParams: any[]): void {
    console.debug(message, ...optionalParams);
  },
};

export const mockLoggerService = jest.mocked(loggerService);

@Global()
@Module({
  providers: [{ provide: LoggingService, useValue: mockLoggerService }],
  exports: [LoggingService],
})
export class TestLoggingModule {}
