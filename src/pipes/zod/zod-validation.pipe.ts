import { PipeTransform, Injectable } from '@nestjs/common';
import { Schema, SafeParseError } from 'zod';
import { HttpStatus } from '@nestjs/common';

export const createZodException = <T>({ error }: SafeParseError<T>) => {
  return {
    statusCode: HttpStatus.BAD_REQUEST,
    message: error.issues,
  };
};

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: Schema) {}

  transform<T>(value: T): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw createZodException(result);
    }

    return result.data;
  }
}
