import { faker } from '@faker-js/faker';
import { ConfigService } from '@nestjs/config';

import { mockNetworkService } from '../network/__tests__/test.network.module';
import { GatewaySafeInfoService } from './gateway.safe-info.service';

describe('GatewaySafeInfoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockConfigService = new ConfigService({
    gatewayUrl: faker.internet.url(),
  });

  const safeInfoService = new GatewaySafeInfoService(
    mockConfigService,
    mockNetworkService,
  );

  describe('isSafeContract', () => {
    it('should return true if the safe exists', async () => {
      mockNetworkService.get.mockImplementation(() => Promise.resolve());

      const chainId = '5';
      const address = faker.finance.ethereumAddress();

      const result = await safeInfoService.isSafeContract(chainId, address);

      expect(result).toBe(true);
    });

    it('should return false if the safe does not exist', async () => {
      mockNetworkService.get.mockImplementation(() => Promise.reject());

      const chainId = '5';
      const address = faker.finance.ethereumAddress();

      const result = await safeInfoService.isSafeContract(chainId, address);

      expect(result).toBe(false);
    });
  });
});
