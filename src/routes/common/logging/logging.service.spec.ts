import { ClsService } from 'nestjs-cls';
import { RequestScopedLoggingService } from './logging.service';
import * as winston from 'winston';

const mockClsService = {
  getId: jest.fn(() => '123-456'),
} as unknown as ClsService;

jest.mock('winston');

describe('RequestScopedLoggingService', () => {
  const infoMock = jest.fn();
  const debugMock = jest.fn();
  const errorMock = jest.fn();
  const warnMock = jest.fn();
  let loggingService: RequestScopedLoggingService;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01'));
    jest.spyOn(winston, 'info').mockImplementation(infoMock);
    jest.spyOn(winston, 'debug').mockImplementation(debugMock);
    jest.spyOn(winston, 'error').mockImplementation(errorMock);
    jest.spyOn(winston, 'warn').mockImplementation(warnMock);

    loggingService = new RequestScopedLoggingService(mockClsService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('log', () => {
    const message = 'Some message';
    loggingService.log(message);

    expect(infoMock).toHaveBeenCalledTimes(1);
    expect(infoMock).toHaveBeenCalledWith(
      `${new Date('2023-01-01').toISOString()} 123-456 - ${message}`,
    );
  });

  it('error', () => {
    const message = 'Some message';
    loggingService.error(message);

    expect(errorMock).toHaveBeenCalledTimes(1);
    expect(errorMock).toHaveBeenCalledWith(
      `${new Date('2023-01-01').toISOString()} 123-456 - ${message}`,
    );
  });

  it('warn', () => {
    const message = 'Some message';
    loggingService.warn(message);

    expect(warnMock).toHaveBeenCalledTimes(1);
    expect(warnMock).toHaveBeenCalledWith(
      `${new Date('2023-01-01').toISOString()} 123-456 - ${message}`,
    );
  });

  it('debug', () => {
    const message = 'Some message';
    loggingService.debug(message);

    expect(debugMock).toHaveBeenCalledTimes(1);
    expect(debugMock).toHaveBeenCalledWith(
      `${new Date('2023-01-01').toISOString()} 123-456 - ${message}`,
    );
  });
});
