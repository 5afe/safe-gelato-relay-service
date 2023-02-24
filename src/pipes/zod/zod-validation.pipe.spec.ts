import { faker } from '@faker-js/faker';
import { z } from 'zod';

import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const MIN_LENGTH = 5;

  const UserSchema = z.object({
    firstName: z
      .string()
      .refine((val) => Promise.resolve(val.length >= MIN_LENGTH)),
    lastName: z.string(),
    age: z.number(),
  });

  const pipe = new ZodValidationPipe(UserSchema);

  it('should validate valid data', async () => {
    const valid = {
      firstName: faker.datatype.string(MIN_LENGTH),
      lastName: faker.datatype.string(),
      age: faker.datatype.number(),
    };

    expect(pipe.transform(valid)).resolves.toEqual(valid);
  });

  it('should throw an error for invalid data', async () => {
    const invalid = {
      firstName: MIN_LENGTH + 1,
      lastName: faker.datatype.string(),
      age: false,
    };

    try {
      await pipe.transform(invalid);

      // This should not be reached
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });
});
