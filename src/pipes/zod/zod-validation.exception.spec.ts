import { faker } from '@faker-js/faker';
import { HttpStatus } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationException } from './zod-validation.exception';

describe('ZodValidationException', () => {
  const UserSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
  });

  it('should correctly create exception', () => {
    const invalid = {
      firstName: faker.datatype.string(),
      lastName: false,
    };

    const result = UserSchema.safeParse(invalid);

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    const error = new ZodValidationException(result.error);

    expect(error).toBeInstanceOf(ZodValidationException);

    expect(error.message).toBe('Validation failed');

    expect(error.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);

    expect(error.getResponse()).toStrictEqual({
      message: 'Validation failed',
      cause: [
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'boolean',
          path: ['lastName'],
          message: 'Expected string, received boolean',
        },
      ],
    });
  });
});
