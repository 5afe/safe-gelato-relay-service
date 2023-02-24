import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { ThrottlerGuard } from '@nestjs/throttler';

import { MockThrottlerStorage } from '../../mocks/throttler-storage.mock';
import { RelayThrottlerGuard } from './relay.guard';

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

  const getContext = (address = faker.finance.ethereumAddress()) => {
    const req = {
      body: {
        chainId: '5',
        to: address,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    const res = { header: (..._args: any[]) => {} };

    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as unknown as ExecutionContext;
  };

  it('should return the chain ID and to address as the tracker', () => {
    const req = {
      body: {
        chainId: '5',
        to: faker.finance.ethereumAddress(),
      },
    };

    expect(relayThrottlerGuard.getTracker(req)).toEqual(`5:${req.body.to}`);
  });

  it('should use the chain ID and address as the key', () => {
    const context = getContext();
    const req = context.switchToHttp().getRequest();

    expect(relayThrottlerGuard.generateKey(context)).toEqual(
      `5:${req.body.to}`,
    );
  });

  it('should rate limit if the to address is valid', async () => {
    const handleRequestSpy = jest.spyOn(relayThrottlerGuard, 'handleRequest');
    const superHandleRequestSpy = jest.spyOn(
      ThrottlerGuard.prototype as any, // handleRequest is a protected method
      'handleRequest',
    );

    await relayThrottlerGuard.handleRequest(getContext(), 1, 1);

    expect(handleRequestSpy).toHaveBeenCalledTimes(1);
    expect(superHandleRequestSpy).toHaveBeenCalledTimes(1);
  });

  it('should skip rate limiting if the to address is not valid', async () => {
    const handleRequestSpy = jest.spyOn(relayThrottlerGuard, 'handleRequest');
    const superHandleRequestSpy = jest.spyOn(
      ThrottlerGuard.prototype as any, // handleRequest is a protected method
      'handleRequest',
    );

    await relayThrottlerGuard.handleRequest(getContext('0x123'), 1, 1);

    expect(handleRequestSpy).toHaveBeenCalledTimes(1);
    expect(superHandleRequestSpy).not.toHaveBeenCalled();
  });
});
