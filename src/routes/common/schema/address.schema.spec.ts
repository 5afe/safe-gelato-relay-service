import { faker } from '@faker-js/faker';

import { AddressSchema } from './address.schema';

describe('AddressSchema', () => {
  it('should validate a valid address', () => {
    const result = AddressSchema.safeParse(faker.finance.ethereumAddress());

    expect(result.success).toBe(true);
  });

  it('should not validate an invalid address', () => {
    [true, '', 'abc', '1.23', '123', 123, '0x123'].forEach((address) => {
      const result = AddressSchema.safeParse(address);

      expect(result.success).toBe(false);
    });
  });
});
