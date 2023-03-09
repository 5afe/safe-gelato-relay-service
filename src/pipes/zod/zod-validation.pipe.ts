import {
  PipeTransform,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Schema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: Schema) {}

  async transform<T>(value: T): Promise<T> {
    const result = await this.schema.safeParseAsync(value);

    if (!result.success) {
      throw new HttpException(
        'Validation failed',
        HttpStatus.UNPROCESSABLE_ENTITY,
        { cause: result.error },
      );
    }

    return result.data;
  }
}
