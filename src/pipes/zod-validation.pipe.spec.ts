import { faker } from '@faker-js/faker';
import { z } from 'zod';

import { ZodValidationPipe } from './zod-validation.pipe';

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

  it('should format the ZodError', () => {
    const pipe = new ZodValidationPipe(UserSchema);

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

    expect(() => pipe.transform(invalid)).toThrowError(
      expect.objectContaining(expectedError),
    );
  });
});
