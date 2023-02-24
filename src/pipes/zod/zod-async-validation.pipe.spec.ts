import { faker } from '@faker-js/faker';
import { z } from 'zod';

import { ZodAsyncValidationPipe } from './zod-async-validation.pipe';

describe('ZodAsyncValidationPipe', () => {
  const UserSchema = z.object({
    firstName: z.string().refine((val) => Promise.resolve(val.length > 5)),
    lastName: z.string(),
  });

  it('should validate against schema', async () => {
    const pipe = new ZodAsyncValidationPipe(UserSchema);

    const valid = {
      firstName: 'Arhtur',
      lastName: faker.datatype.string(),
    };

    const invalid = {
      firstName: 'John',
      lastName: faker.datatype.string(),
    };

    expect(pipe.transform(valid)).resolves.toEqual(valid);

    try {
      await pipe.transform(invalid);

      // This should not be reached
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });
});
