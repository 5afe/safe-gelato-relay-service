import { Injectable, LoggerService } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import * as winston from 'winston';

export const LoggingService = Symbol('LoggerService');

@Injectable()
export class RequestScopedLoggingService implements LoggerService {
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
  verbose(message: string, ...optionalParams: any[]) {
    winston.verbose(this.transformMessage(message), ...optionalParams);
  }
  setLogLevels() {
    // We do not use this
  }

  private transformMessage(message: string): string {
    const requestId = this.cls.getId();
    const timestamp = Date.now();
    const dateAsString = new Date(timestamp).toISOString();
    return `${dateAsString} ${requestId} - ${message}`;
  }
}
