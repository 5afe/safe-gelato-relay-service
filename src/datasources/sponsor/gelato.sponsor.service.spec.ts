import { faker } from '@faker-js/faker';
import { ConfigService } from '@nestjs/config';
import { SupportedChainId } from '../../config/constants';
import { MOCK_EXEC_TX_CALL_DATA } from '../../mocks/transaction-data.mock';
import { GelatoSponsorService } from './gelato.sponsor.service';

const mockSponsoredCall = jest.fn();
jest.mock('@gelatonetwork/relay-sdk', () => ({
  GelatoRelay: jest.fn().mockImplementation(() => ({
    sponsoredCall: mockSponsoredCall,
  })),
}));

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

  const relayService = new GelatoSponsorService(mockConfigService);

  describe('sponsoredCall', () => {
    it('should call the relay service', async () => {
      const address = faker.finance.ethereumAddress();
      const body = {
        chainId: '5' as SupportedChainId,
        to: address,
        data: MOCK_EXEC_TX_CALL_DATA,
        safeAddress: address,
      };

      await relayService.sponsoredCall(body);

      expect(mockSponsoredCall).toHaveBeenCalledTimes(1);
    });

    it('should add a gas buffer to the relay', async () => {
      const address = faker.finance.ethereumAddress();
      const body = {
        chainId: '5' as SupportedChainId,
        to: address,
        data: MOCK_EXEC_TX_CALL_DATA,
        safeAddress: address,
        gasLimit: '123',
      };

      await relayService.sponsoredCall(body);

      expect(mockSponsoredCall).toHaveBeenCalledWith(
        { chainId: body.chainId, target: body.to, data: body.data },
        expect.any(String),
        {
          gasLimit: '150123',
        },
      );
    });
  });
});
