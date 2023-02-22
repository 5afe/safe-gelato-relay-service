import { faker } from '@faker-js/faker';

import { SponsoredCallSchema } from './sponsored-call.schema';

describe('sponsoredCall schema', () => {
  it('should validate a valid sponsoredCall', () => {
    const result = SponsoredCallSchema.safeParse({
      chainId: faker.random.numeric(),
      target: faker.finance.ethereumAddress(),
      data: faker.datatype.hexadecimal(),
    });

    expect(result.success).toBe(true);
  });

  it('should not validate an invalid chainId', () => {
    [true, 'abc', '1.23', 123, '0x123'].forEach((chainId) => {
      const result = SponsoredCallSchema.safeParse({
        chainId,
        target: faker.finance.ethereumAddress(),
        data: faker.datatype.hexadecimal(),
      });

      expect(result.success).toBe(false);
    });
  });

  it('should not validate an invalid target', () => {
    [true, 'abc', '1.23', '123', 123, '0x123'].forEach((target) => {
      const result = SponsoredCallSchema.safeParse({
        chainId: faker.random.numeric(),
        target,
        data: faker.datatype.hexadecimal(),
      });

      expect(result.success).toBe(false);
    });
  });

  it('should not validate an invalid data', () => {
    [true, 'abc', '1.23', '123', 123].forEach((data) => {
      const result = SponsoredCallSchema.safeParse({
        chainId: faker.random.numeric(),
        target: faker.finance.ethereumAddress(),
        data,
      });

      expect(result.success).toBe(false);
    });
  });
});
