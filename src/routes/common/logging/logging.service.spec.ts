import { ClsService } from 'nestjs-cls';
import { RequestScopedLoggingService } from './logging.service';
import * as winston from 'winston';

const mockClsService = {
  getId: jest.fn(() => '123-456'),
} as unknown as ClsService;

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
} as unknown as winston.Logger;

describe('RequestScopedLoggingService', () => {
  let loggingService: RequestScopedLoggingService;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    loggingService = new RequestScopedLoggingService(
      mockLogger,
      mockClsService,
    );
  });

  it('info', () => {
    const message = 'Some message';

    loggingService.info(message);

    expect(mockLogger.info).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `${new Date('2023-01-01').toISOString()} 123-456 - ${message}`,
    );
  });

  it('error', () => {
    const message = 'Some message';

    loggingService.error(message);

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith(
      `${new Date('2023-01-01').toISOString()} 123-456 - ${message}`,
    );
  });

  it('warn', () => {
    const message = 'Some message';

    loggingService.warn(message);

    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      `${new Date('2023-01-01').toISOString()} 123-456 - ${message}`,
    );
  });

  it('debug', () => {
    const message = 'Some message';

    loggingService.debug(message);

    expect(mockLogger.debug).toHaveBeenCalledTimes(1);
    expect(mockLogger.debug).toHaveBeenCalledWith(
      `${new Date('2023-01-01').toISOString()} 123-456 - ${message}`,
    );
  });
});
