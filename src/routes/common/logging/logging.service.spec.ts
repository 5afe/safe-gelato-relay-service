import { ClsService } from 'nestjs-cls';
import { RequestScopedLoggingService } from './logging.service';
import * as winston from 'winston';

const mockClsService = {
  getId: jest.fn(() => '123-456'),
} as unknown as ClsService;

const mockLogger = {
  log: jest.fn(),
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

    expect(mockLogger.log).toHaveBeenCalledTimes(1);
    expect(mockLogger.log).toHaveBeenCalledWith('info', {
      message: 'Some message',
      request_id: '123-456',
      timestamp: new Date('2023-01-01').toISOString(),
    });
  });

  it('error', () => {
    const message = 'Some message';

    loggingService.error(message);

    expect(mockLogger.log).toHaveBeenCalledTimes(1);
    expect(mockLogger.log).toHaveBeenCalledWith('error', {
      message: 'Some message',
      request_id: '123-456',
      timestamp: new Date('2023-01-01').toISOString(),
    });
  });

  it('warn', () => {
    const message = 'Some message';

    loggingService.warn(message);

    expect(mockLogger.log).toHaveBeenCalledTimes(1);
    expect(mockLogger.log).toHaveBeenCalledWith('warn', {
      message: 'Some message',
      request_id: '123-456',
      timestamp: new Date('2023-01-01').toISOString(),
    });
  });

  it('debug', () => {
    const message = 'Some message';

    loggingService.debug(message);

    expect(mockLogger.log).toHaveBeenCalledTimes(1);
    expect(mockLogger.log).toHaveBeenCalledWith('debug', {
      message: 'Some message',
      request_id: '123-456',
      timestamp: new Date('2023-01-01').toISOString(),
    });
  });
});
