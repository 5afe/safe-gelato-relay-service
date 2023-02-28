import { faker } from '@faker-js/faker';
import { getMultiSendCallOnlyDeployment } from '@safe-global/safe-deployments/dist/libs';
import * as axios from 'axios';
import { ZodError } from 'zod';

import {
  MOCK_EXEC_TX_CALL_DATA,
  MOCK_MULTISEND_TX_CALL_DATA,
} from '../../../../mocks/transaction-data.mock';
import { SponsoredCallSchema } from './sponsored-call.schema';
import * as txHelpers from '../../../common/transactions.helper';

jest.mock('axios');

describe('sponsoredCall schema', () => {
  // chainId validation test coverage in chain-id.schema.spec.ts
  // to address validation test coverage in address.schema.spec.ts

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('should validate a valid sponsoredCall', () => {
    axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

    it('should validate and extract the Safe address from a valid execTransaction call', async () => {
      const data = {
        chainId: '5',
        to: faker.finance.ethereumAddress(),
        data: MOCK_EXEC_TX_CALL_DATA,
        gasLimit: faker.random.numeric(),
      };

      const result = await SponsoredCallSchema.safeParseAsync(data);

      expect(result.success).toBe(true);

      if (!result.success) {
        return;
      }

      expect(result.data).toStrictEqual({
        ...data,
        safeAddress: data.to,
      });
    });

    it('should validate and extract the Safe address from a valid multisend call', async () => {
      const chainId = '5';

      const to = getMultiSendCallOnlyDeployment({
        network: chainId,
      })?.defaultAddress;

      const data = {
        chainId,
        to,
        data: MOCK_MULTISEND_TX_CALL_DATA,
        gasLimit: faker.random.numeric(),
      };

      const result = await SponsoredCallSchema.safeParseAsync(data);

      expect(result.success).toBe(true);

      if (!result.success) {
        return;
      }

      expect(result.data).toStrictEqual({
        ...data,
        safeAddress: '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b',
      });
    });
  });

  it('should not validate an invalid gasLimit', async () => {
    axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

    for await (const gasLimit of [true, '', 'abc', '1.23', 123]) {
      const result = await SponsoredCallSchema.safeParseAsync({
        chainId: '5',
        to: faker.finance.ethereumAddress(),
        data: MOCK_EXEC_TX_CALL_DATA,
        gasLimit,
      });

      expect(result.success).toBe(false);
    }
  });

  it('should not validate invalid data', async () => {
    axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

    for await (const data of ['', 'abc', '1.23', '123', '0x123']) {
      const result = await SponsoredCallSchema.safeParseAsync({
        chainId: '5',
        to: faker.finance.ethereumAddress(),
        data,
      });

      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }

      expect(result.error).toStrictEqual(
        new ZodError([
          {
            message: 'Only (batched) Safe transactions can be relayed.',
            path: ['data'],
            code: 'custom',
          },
        ]),
      );
    }
  });

  it('should not validate an invalid execTransaction call', async () => {
    axios.default.get = jest.fn().mockImplementation(() => Promise.reject());

    const result = await SponsoredCallSchema.safeParseAsync({
      chainId: '5',
      to: faker.finance.ethereumAddress(),
      data: MOCK_EXEC_TX_CALL_DATA,
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error).toStrictEqual(
      new ZodError([
        {
          message: 'Only `execTransaction` from Safes can be relayed.',
          path: ['data'],
          code: 'custom',
        },
      ]),
    );
  });

  it('should not validate an invalid multiSend call', async () => {
    jest.spyOn(txHelpers, 'isValidMultiSendCall').mockResolvedValue(false);

    const result = await SponsoredCallSchema.safeParseAsync({
      chainId: '5',
      to: faker.finance.ethereumAddress(),
      data: MOCK_MULTISEND_TX_CALL_DATA,
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error).toStrictEqual(
      new ZodError([
        {
          message: 'Invalid `multiSend` transaction.',
          path: ['data'],
          code: 'custom',
        },
      ]),
    );
  });
});
