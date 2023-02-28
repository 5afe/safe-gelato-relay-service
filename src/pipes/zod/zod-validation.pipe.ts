import { PipeTransform, Injectable } from '@nestjs/common';
import { Schema } from 'zod';

import { ZodValidationException } from './zod-validation.exception';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: Schema) {}

  async transform<T>(value: T): Promise<T> {
    const result = await this.schema.safeParseAsync(value);

    if (!result.success) {
      throw new ZodValidationException(result.error);
    }

    return result.data;
  }
}
