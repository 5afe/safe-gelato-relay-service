import { PipeTransform, Injectable } from '@nestjs/common';
import { Schema } from 'zod';

import { createZodValidationException } from './zod-validation.exception';

@Injectable()
export class ZodAsyncValidationPipe implements PipeTransform {
  constructor(private schema: Schema) {}

  async transform<T>(value: T): Promise<T> {
    const result = await this.schema.safeParseAsync(value);

    if (!result.success) {
      throw createZodValidationException(result.error);
    }

    return result.data;
  }
}
