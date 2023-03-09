import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import * as winston from 'winston';
import { ILoggingService } from './logging.interface';

/**
 * Implementation of LoggerService which prepends the current time and a unique request ID to every logged message.
 *
 * The requestID is generated and provided using the `nestjs-cls` `ClsService` which uses the async local storage to store a uuid for each processed request through a middleware.
 */
@Injectable()
export class RequestScopedLoggingService implements ILoggingService {
  constructor(private readonly cls: ClsService) {}
  log(message: string, ...optionalParams: any[]) {
    winston.info(this.transformMessage(message), ...optionalParams);
  }
  error(message: string, ...optionalParams: any[]) {
    winston.error(this.transformMessage(message), ...optionalParams);
  }
  warn(message: string, ...optionalParams: any[]) {
    winston.warn(this.transformMessage(message), ...optionalParams);
  }
  debug(message: string, ...optionalParams: any[]) {
    winston.debug(this.transformMessage(message), ...optionalParams);
  }

  private transformMessage(message: string): string {
    const requestId = this.cls.getId();
    const timestamp = Date.now();
    const dateAsString = new Date(timestamp).toISOString();
    return `${dateAsString} ${requestId} - ${message}`;
  }
}
