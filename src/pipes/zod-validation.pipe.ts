import { PipeTransform, Injectable, HttpStatus } from '@nestjs/common';
import { Schema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: Schema) {}

  transform<T>(value: T): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw {
        statusCode: HttpStatus.BAD_REQUEST,
        message: result.error.issues,
      };
    }

    return result.data;
  }
}
