import { ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker';

import { RelayService, _getRelayGasLimit } from './relay.service';
import { SupportedChainId } from '../../config/constants';
import { RelayLimitService } from './services/relay-limit.service';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { MOCK_EXEC_TX_CALL_DATA } from '../../mocks/transaction-data.mock';

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
  const mockConfigService = new ConfigService({
    gelato: {
      apiKey: {
        '5': 'fakeApiKey',
      },
    },
    relay: {
      ttl: 60 * 60,
      limit: 5,
    },
  });

  let relayLimitService: RelayLimitService;
  let throttlerStorageService: ThrottlerStorageService;
  let relayService: RelayService;

  beforeEach(() => {
    jest.clearAllMocks();

    throttlerStorageService = new ThrottlerStorageService();
    relayLimitService = new RelayLimitService(
      mockConfigService,
      throttlerStorageService,
    );

    relayService = new RelayService(mockConfigService, relayLimitService);
  });

  afterEach(() => {
    throttlerStorageService.onApplicationShutdown();
  });

  describe('sponsoredCall', () => {
    it('should call the relayer', async () => {
      const address = faker.finance.ethereumAddress();
      const body = {
        chainId: '5' as SupportedChainId,
        to: address,
        data: MOCK_EXEC_TX_CALL_DATA,
        safeAddress: address,
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

    it('should throw if the relayer fails', async () => {
      mockSponsoredCall.mockImplementationOnce(() => Promise.reject());

      const address = faker.finance.ethereumAddress();
      const body = {
        chainId: '5' as SupportedChainId,
        to: address,
        data: MOCK_EXEC_TX_CALL_DATA,
        safeAddress: address,
      };

      expect(relayService.sponsoredCall(body)).rejects.toThrow('Relay failed');
    });

    it('should increment the relay limit if limit has not been reached', async () => {
      const canRelaySpy = jest
        .spyOn(relayLimitService, 'canRelay')
        .mockReturnValue(true);
      const incrementSpy = jest.spyOn(relayLimitService, 'increment');

      const address = faker.finance.ethereumAddress();
      const body = {
        chainId: '5' as SupportedChainId,
        to: address,
        data: MOCK_EXEC_TX_CALL_DATA,
        safeAddress: address,
      };

      await relayService.sponsoredCall(body);

      expect(canRelaySpy).toHaveBeenCalledTimes(1);
      expect(incrementSpy).toHaveBeenCalledTimes(1);
    });

    it('should not increment the relay limit if limit has been reached', () => {
      const canRelaySpy = jest
        .spyOn(relayLimitService, 'canRelay')
        .mockReturnValue(false);
      const incrementSpy = jest.spyOn(relayLimitService, 'increment');

      const address = faker.finance.ethereumAddress();
      const body = {
        chainId: '5' as SupportedChainId,
        to: address,
        data: MOCK_EXEC_TX_CALL_DATA,
        safeAddress: address,
      };

      expect(relayService.sponsoredCall(body)).rejects.toThrow(
        'Relay limit reached',
      );

      expect(canRelaySpy).toHaveBeenCalledTimes(1);
      expect(incrementSpy).not.toHaveBeenCalled();
    });
  });
});
