import { faker } from '@faker-js/faker';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationException } from './zod-validation.exception';

describe('createZodValidationException', () => {
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

    expect(error).toBeInstanceOf(BadRequestException);

    expect(error.message).toBe('Validation failed');
    expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);

    expect(error.getResponse()).toStrictEqual({
      statusCode: 400,
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
