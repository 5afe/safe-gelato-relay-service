import { SponsoredCallValidationError } from '../pipes/sponsored-call-dto.validator.pipe';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(SponsoredCallValidationError)
export class SponsoredCallValidationExceptionFilter
  implements ExceptionFilter<SponsoredCallValidationError>
{
  catch(exception: SponsoredCallValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: exception.message,
    });
  }
}
