import { ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import * as axios from 'axios';

import { SafeInfoHelper } from './safe-info.helper';

jest.mock('axios');

describe('SafeInfoHelper', () => {
  const configService = new ConfigService({
    gatewayUrl: 'https://mock.com',
  });
  const safeInfoHelper = new SafeInfoHelper(configService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true if the address is a Safe', async () => {
    axios.default.get = jest
      .fn()
      .mockImplementation(() => Promise.resolve({ data: 'mockSafe' }));

    const result = await safeInfoHelper.isSafe(
      '5',
      faker.finance.ethereumAddress(),
    );
    expect(result).toBe(true);
  });

  it('should return false if the address is not a Safe', async () => {
    axios.default.get = jest.fn().mockImplementation(() => Promise.reject());

    const result = await safeInfoHelper.isSafe(
      '5',
      faker.finance.ethereumAddress(),
    );
    expect(result).toBe(false);
  });
});
