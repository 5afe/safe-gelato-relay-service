import { ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker';

import { RelayService, _getRelayGasLimit } from './relay.service';
import { SupportedChainId } from '../../config/constants';
import { MockThrottlerStorage } from '../../mocks/throttler-storage.mock';
import { getRelayThrottlerGuardKey } from './relay.guard';

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
  const mockThrottlerStorageService = new MockThrottlerStorage();

  const relayService = new RelayService(
    configService,
    mockThrottlerStorageService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sponsoredCall', () => {
    const EXEC_TX_CALL_DATA = '0x6a761202';

    it('should call the relayer', async () => {
      const body = {
        chainId: '5' as SupportedChainId,
        to: faker.finance.ethereumAddress(),
        data: EXEC_TX_CALL_DATA,
      };

      await relayService.sponsoredCall(body);

      expect(mockSponsoredCall).toHaveBeenCalledWith(
        { chainId: body.chainId, target: body.to, data: body.data },
        expect.any(String),
        {
          gasLimit: undefined,
        },
      );
    });
  });

  describe('getRelayLimit', () => {
    it('should return the pre-defined limit if no there are no total hits', () => {
      const chainId = '5' as SupportedChainId;
      const address = faker.finance.ethereumAddress();

      expect(relayService.getRelayLimit(chainId, address)).toEqual({
        remaining: 5,
      });
    });

    it('should return the remaining relays left', () => {
      const chainId = '5' as SupportedChainId;
      const address = faker.finance.ethereumAddress();

      const key = getRelayThrottlerGuardKey(chainId, address);

      mockThrottlerStorageService.increment(key, 1);

      expect(relayService.getRelayLimit(chainId, address)).toEqual({
        remaining: 4,
        expiresAt: expect.any(Number),
      });
    });

    it('should return 0 if there are no relays left if there are more higher hits', () => {
      const chainId = '5' as SupportedChainId;
      const address = faker.finance.ethereumAddress();

      const key = getRelayThrottlerGuardKey(chainId, address);

      const limit = configService.getOrThrow<number>('throttle.limit');

      // One request more than the limit
      Array.from({ length: limit + 1 }, () => {
        mockThrottlerStorageService.increment(key, 1);
      });

      expect(relayService.getRelayLimit(chainId, address)).toEqual({
        remaining: 0,
        expiresAt: expect.any(Number),
      });
    });
  });
});
