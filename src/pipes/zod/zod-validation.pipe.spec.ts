import { faker } from '@faker-js/faker';
import { z } from 'zod';

import { createZodException, ZodValidationPipe } from './zod-validation.pipe';

describe('createZodException', () => {
  const UserSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
  });

  it('should format the ZodError', () => {
    const invalid = {
      firstName: faker.datatype.string(),
      lastName: false,
    };

    const expectedError = {
      statusCode: 400,
      message: [
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'boolean',
          path: ['lastName'],
          message: 'Expected string, received boolean',
        },
      ],
    };

    const result = UserSchema.safeParse(invalid);

    expect(result.success).toBe(false);
    if (!result.success) {
      const exception = createZodException(result);
      expect(exception).toStrictEqual(expectedError);
    }
  });
});

describe('ZodValidationPipe', () => {
  const UserSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
  });

  it('should validate against schema', () => {
    const pipe = new ZodValidationPipe(UserSchema);

    const valid = {
      firstName: faker.datatype.string(),
      lastName: faker.datatype.string(),
    };

    const invalid = {
      firstName: faker.datatype.string(),
      lastName: false,
    };

    expect(pipe.transform(valid)).toEqual(valid);

    expect(() => pipe.transform(invalid)).toThrowError();
  });
});
