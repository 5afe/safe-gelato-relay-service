import { MockThrottlerStorage } from '../../mocks/throttler-storage.mock';
import { RelayThrottlerGuard } from './relay.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('RelayThrottlerGuard', () => {
  const mockThrottlerStorage = new MockThrottlerStorage();
  const reflector = new Reflector();
  const relayThrottlerGuard = new RelayThrottlerGuard(
    {},
    mockThrottlerStorage,
    reflector,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the target address as the tracker', () => {
    const req = { body: { target: '0x123' } };
    expect(relayThrottlerGuard.getTracker(req)).toEqual('0x123');
  });

  it('should only use the target address as the key', () => {
    const target = '0x123';
    expect(
      relayThrottlerGuard.generateKey(
        null as unknown as ExecutionContext,
        target,
      ),
    ).toEqual(target);
  });

  it('should rate limit if the target is a valid address', async () => {
    const handleRequestSpy = jest.spyOn(relayThrottlerGuard, 'handleRequest');
    const superHandleRequestSpy = jest.spyOn(
      ThrottlerGuard.prototype as any, // handleRequest is a protected method
      'handleRequest',
    );

    const req = { body: { target: faker.finance.ethereumAddress() } };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    const res = { header: (..._args: any[]) => {} };
    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    };

    await relayThrottlerGuard.handleRequest(
      context as unknown as ExecutionContext,
      1,
      1,
    );

    expect(handleRequestSpy).toHaveBeenCalledTimes(1);
    expect(superHandleRequestSpy).toHaveBeenCalledTimes(1);
  });

  it('should skip rate limiting if the target is not a valid address', () => {
    const handleRequestSpy = jest.spyOn(relayThrottlerGuard, 'handleRequest');

    const req = { body: { target: '0x123' } };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    const res = { header: (..._args: any[]) => {} };
    const context = {
      switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
    };

    expect(
      relayThrottlerGuard.handleRequest(
        context as unknown as ExecutionContext,
        1,
        1,
      ),
    ).resolves.toEqual(true);

    expect(handleRequestSpy).toHaveBeenCalledTimes(1);
  });
});
