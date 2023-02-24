import { faker } from '@faker-js/faker';
import * as axios from 'axios';

import { SponsoredCallSchema } from './sponsored-call.schema';

const EXEC_TX_CALL_DATA = '0x6a761202';

jest.mock('axios');

describe('sponsoredCall schema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // chainId validation test coverage in chain-id.schema.spec.ts
  // to address validation test coverage in address.schema.spec.ts

  it('should validate a valid sponsoredCall', async () => {
    axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

    const result = await SponsoredCallSchema.safeParseAsync({
      chainId: '5',
      to: faker.finance.ethereumAddress(),
      data: EXEC_TX_CALL_DATA,
      gasLimit: faker.random.numeric(),
    });

    expect(result.success).toBe(true);
  });

  it('should not validate invalid data', async () => {
    axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

    for await (const data of [true, '', 'abc', '1.23', '123', 123]) {
      const result = await SponsoredCallSchema.safeParseAsync({
        chainId: faker.random.numeric(),
        to: faker.finance.ethereumAddress(),
        data,
      });

      expect(result.success).toBe(false);
    }
  });

  it('should not validate an invalid gasLimit', async () => {
    axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

    for await (const gasLimit of [true, '', 'abc', '1.23', 123]) {
      const result = await SponsoredCallSchema.safeParseAsync({
        chainId: faker.random.numeric(),
        to: faker.finance.ethereumAddress(),
        data: EXEC_TX_CALL_DATA,
        gasLimit,
      });

      expect(result.success).toBe(false);
    }
  });
});
