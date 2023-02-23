import { ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker';

import * as helper from '../common/safe/safe-info.helper';
import { RelayService, _getRelayGasLimit } from './relay.service';
import { SupportedChainId } from '../../config/constants';
import { MockThrottlerStorage } from '../../mocks/throttler-storage.mock';
import { getRelayThrottlerGuardStorageKey } from './relay.guard';

describe('getRelayGasLimit', () => {
  it('should return undefined if no gasLimit is provided', () => {
    expect(_getRelayGasLimit()).toBe(undefined);
  });

  it('should return the gasLimit plus the buffer', () => {
    const GAS_LIMIT_BUFFER = 150_000;

    expect(_getRelayGasLimit('100000')).toBe(
      BigInt(100000) + BigInt(GAS_LIMIT_BUFFER),
    );
  });
});

const mockSponsoredCall = jest.fn();
jest.mock('@gelatonetwork/relay-sdk', () => ({
  GelatoRelay: jest.fn().mockImplementation(() => ({
    sponsoredCall: mockSponsoredCall,
  })),
}));

const mockIsSafe = jest.fn();
jest.mock('../common/safe/safe-info.helper', () => ({
  SafeInfoHelper: jest.fn().mockImplementation(() => ({
    isSafe: mockIsSafe,
  })),
}));

describe('RelayService', () => {
  const configService = new ConfigService({
    gelato: {
      apiKey: {
        '5': 'fakeApiKey',
      },
    },
    throttle: {
      ttl: 60 * 60,
      limit: 5,
    },
  });
  const safeInfoHelper = new helper.SafeInfoHelper(configService);
  const mockThrottlerStorageService = new MockThrottlerStorage();

  const relayService = new RelayService(
    configService,
    safeInfoHelper,
    mockThrottlerStorageService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sponsoredCall', () => {
    const EXEC_TX_CALL_DATA = '0x6a761202';

    it('should call the relayer', async () => {
      mockIsSafe.mockImplementation(() => Promise.resolve(true));

      const body = {
        chainId: '5' as SupportedChainId,
        target: faker.finance.ethereumAddress(),
        data: EXEC_TX_CALL_DATA,
      };

      await relayService.sponsoredCall(body);

      expect(mockSponsoredCall).toHaveBeenCalledWith(body, expect.any(String), {
        gasLimit: undefined,
      });
    });

    it('should throw if the target is not a Safe address', async () => {
      mockIsSafe.mockImplementation(() => Promise.resolve(false));

      const chainId = '5' as SupportedChainId;
      const target = faker.finance.ethereumAddress();

      const body = {
        chainId,
        target,
        data: EXEC_TX_CALL_DATA,
      };

      try {
        await relayService.sponsoredCall(body);

        // Break test if the above call does not throw
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toEqual({
          statusCode: 400,
          message: `${target} is not a Safe on chain ${chainId}`,
        });
      }

      expect(mockSponsoredCall).not.toHaveBeenCalled();
    });
  });

  describe('getRelayLimit', () => {
    it('should return the pre-defined limit if no there are no total hits', () => {
      const chainId = '5' as SupportedChainId;
      const target = faker.finance.ethereumAddress();

      expect(relayService.getRelayLimit(chainId, target)).toEqual({
        remaining: 5,
      });
    });

    it('should return the remaining relays left', () => {
      const chainId = '5' as SupportedChainId;
      const target = faker.finance.ethereumAddress();

      const key = getRelayThrottlerGuardStorageKey(chainId, target);

      mockThrottlerStorageService.increment(key, 1);

      expect(relayService.getRelayLimit(chainId, target)).toEqual({
        remaining: 4,
        expiresAt: expect.any(Number),
      });
    });

    it('should return 0 if there are no relays left if there are more higher hits', () => {
      const chainId = '5' as SupportedChainId;
      const target = faker.finance.ethereumAddress();

      const key = getRelayThrottlerGuardStorageKey(chainId, target);

      const limit = configService.getOrThrow<number>('throttle.limit');

      // One request more than the limit
      Array.from({ length: limit + 1 }, () => {
        mockThrottlerStorageService.increment(key, 1);
      });

      expect(relayService.getRelayLimit(chainId, target)).toEqual({
        remaining: 0,
        expiresAt: expect.any(Number),
      });
    });
  });
});
