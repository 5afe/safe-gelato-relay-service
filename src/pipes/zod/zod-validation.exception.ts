import { BadRequestException, HttpStatus } from '@nestjs/common';
import { ZodError } from 'zod';

export class ZodValidationException extends BadRequestException {
  constructor(private error: ZodError) {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      cause: error.issues,
    });
  }
}
