import { PipeTransform, Injectable } from '@nestjs/common';
import { Schema } from 'zod';

import { createZodException } from './zod-validation.pipe';

@Injectable()
export class ZodAsyncValidationPipe implements PipeTransform {
  constructor(private schema: Schema) {}

  async transform<T>(value: T): Promise<T> {
    const result = await this.schema.safeParseAsync(value);

    if (!result.success) {
      throw createZodException(result);
    }

    return result.data;
  }
}
