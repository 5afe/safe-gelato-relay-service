export const LoggingService = Symbol('ILoggingService');

export interface ILoggingService {
  log(message: string, ...optionalParams: any[]): void;
  debug(message: string, ...optionalParams: any[]): void;
  error(message: string, ...optionalParams: any[]): void;
  warn(message: string, ...optionalParams: any[]): void;
}
