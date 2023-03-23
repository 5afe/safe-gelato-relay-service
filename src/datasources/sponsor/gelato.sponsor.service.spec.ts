import { faker } from '@faker-js/faker';
import { GelatoRelay } from '@gelatonetwork/relay-sdk';
import { ConfigService } from '@nestjs/config';
import { SupportedChainId } from '../../config/constants';
import { MOCK_EXEC_TX_CALL_DATA } from '../../mocks/transaction-data.mock';
import { GelatoSponsorService } from './gelato.sponsor.service';

const mockGelatoRelay: GelatoRelay = {
  callWithSyncFee: jest.fn(),
  sponsoredCall: jest.fn(),
  sponsoredCallERC2771: jest.fn(),
  getSignatureDataERC2771: jest.fn(),
  sponsoredCallERC2771WithSignature: jest.fn(),
  isNetworkSupported: jest.fn(),
  getSupportedNetworks: jest.fn(),
  isOracleActive: jest.fn(),
  getGelatoOracles: jest.fn(),
  getPaymentTokens: jest.fn(),
  getEstimatedFee: jest.fn(),
  getTaskStatus: jest.fn(),
};

describe('GelatoSponsorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockConfigService = new ConfigService({
    gelato: {
      apiKey: {
        '5': 'fakeApiKey',
      },
    },
  });

  const mockRelayer = jest.mocked(mockGelatoRelay);

  const relayService = new GelatoSponsorService(mockConfigService, mockRelayer);

  describe('sponsoredCall', () => {
    it('should call the relay service', async () => {
      const address = faker.finance.ethereumAddress();
      const body = {
        chainId: '5' as SupportedChainId,
        to: address,
        data: MOCK_EXEC_TX_CALL_DATA,
        limitAddresses: [address],
      };

      await relayService.sponsoredCall(body);

      expect(mockRelayer.sponsoredCall).toHaveBeenCalledTimes(1);
    });

    it('should add a gas buffer to the relay', async () => {
      const address = faker.finance.ethereumAddress();
      const body = {
        chainId: '5' as SupportedChainId,
        to: address,
        data: MOCK_EXEC_TX_CALL_DATA,
        limitAddresses: [address],
        gasLimit: BigInt('123'),
      };

      await relayService.sponsoredCall(body);

      expect(mockRelayer.sponsoredCall).toHaveBeenCalledWith(
        { chainId: body.chainId, target: body.to, data: body.data },
        expect.any(String),
        {
          gasLimit: '150123',
        },
      );
    });
  });
});
