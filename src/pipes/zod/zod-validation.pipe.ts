import { PipeTransform, Injectable } from '@nestjs/common';
import { Schema } from 'zod';

import { createZodValidationException } from './zod-validation.exception';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: Schema) {}

  transform<T>(value: T): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw createZodValidationException(result.error);
    }

    return result.data;
  }
}
