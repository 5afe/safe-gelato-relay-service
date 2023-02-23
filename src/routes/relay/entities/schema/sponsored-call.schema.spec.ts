import { faker } from '@faker-js/faker';

import { SponsoredCallSchema } from './sponsored-call.schema';

const EXEC_TX_CALL_DATA = '0x6a761202';

describe('sponsoredCall schema', () => {
  it('should validate a valid sponsoredCall', () => {
    const result = SponsoredCallSchema.safeParse({
      chainId: '5',
      target: faker.finance.ethereumAddress(),
      data: EXEC_TX_CALL_DATA,
      gasLimit: faker.random.numeric(),
    });

    expect(result.success).toBe(true);
  });

  it('should not validate an invalid chainId', () => {
    [true, '', 'abc', '1.23', 123, '0x123'].forEach((chainId) => {
      const result = SponsoredCallSchema.safeParse({
        chainId,
        target: faker.finance.ethereumAddress(),
        data: EXEC_TX_CALL_DATA,
      });

      expect(result.success).toBe(false);
    });
  });

  it('should not validate an invalid data', () => {
    [true, '', 'abc', '1.23', '123', 123].forEach((data) => {
      const result = SponsoredCallSchema.safeParse({
        chainId: faker.random.numeric(),
        target: faker.finance.ethereumAddress(),
        data,
      });

      expect(result.success).toBe(false);
    });
  });

  it('should not validate an invalid gasLimit', () => {
    [true, '', 'abc', '1.23', 123].forEach((gasLimit) => {
      const result = SponsoredCallSchema.safeParse({
        chainId: faker.random.numeric(),
        target: faker.finance.ethereumAddress(),
        data: EXEC_TX_CALL_DATA,
        gasLimit,
      });

      expect(result.success).toBe(false);
    });
  });

  // target address validation test coverage in address.schema.spec.ts
});
