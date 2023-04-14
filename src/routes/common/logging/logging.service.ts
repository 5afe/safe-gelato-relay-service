import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { ILoggingService } from './logging.interface';
import { Inject } from '@nestjs/common/decorators';
import winston from 'winston';

/**
 * Implementation of LoggerService which prepends the current time and a unique request ID to every logged message.
 *
 * The requestID is generated and provided using the `nestjs-cls` `ClsService` which uses the async local storage to store a uuid for each processed request through a middleware.
 */
@Injectable()
export class RequestScopedLoggingService implements ILoggingService {
  constructor(
    @Inject('Logger') private readonly logger: winston.Logger,
    private readonly cls: ClsService,
  ) {}

  info(message: string, ...optionalParams: unknown[]) {
    this.logger.info(this.transformMessage(message), ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]) {
    this.logger.error(this.transformMessage(message), ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]) {
    this.logger.warn(this.transformMessage(message), ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]) {
    this.logger.debug(this.transformMessage(message), ...optionalParams);
  }

  private transformMessage(message: string): string {
    const requestId = this.cls.getId();
    const timestamp = Date.now();
    const dateAsString = new Date(timestamp).toISOString();
    return `${dateAsString} ${requestId} - ${message}`;
  }
}
