import { HttpException, HttpStatus } from '@nestjs/common';
import { ZodError } from 'zod';

export class ZodValidationException extends HttpException {
  constructor(private error: ZodError) {
    super(
      { message: 'Validation failed', cause: error.issues },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
