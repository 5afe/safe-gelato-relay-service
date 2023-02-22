import { ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker';

import * as helper from '../common/safe/safe-info.helper';
import { RelayService, _getRelayGasLimit } from './relay.service';
import { HttpService } from '@nestjs/axios';
import { SupportedChainId } from 'src/config/constants';

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

const mockIsSafe = jest.fn();
jest.mock('../common/safe/safe-info.helper', () => ({
  SafeInfoHelper: jest.fn().mockImplementation(() => ({
    isSafe: mockIsSafe,
  })),
}));

describe('RelayService', () => {
  const configService = new ConfigService();
  const safeInfoHelper = new helper.SafeInfoHelper(
    configService,
    new HttpService(),
  );

  const relayService = new RelayService(configService, safeInfoHelper);

  describe('sponsoredCall', () => {
    it('should throw if the target is not a Safe address', async () => {
      const relayServiceSpy = jest.spyOn(relayService, 'sponsoredCall');
      mockIsSafe.mockImplementation(() => Promise.resolve(false));

      const chainId = '5' as SupportedChainId;
      const target = faker.finance.ethereumAddress();

      const body = {
        chainId,
        target,
        data: '0x6a761202', // execTransaction
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

      expect(relayServiceSpy).toHaveBeenCalledTimes(1);
      expect(mockIsSafe).toHaveBeenCalledTimes(1);
    });
  });
});
