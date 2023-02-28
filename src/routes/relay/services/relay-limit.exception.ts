import { BadRequestException, HttpStatus } from '@nestjs/common';

export class RelayLimitException extends BadRequestException {
  constructor(private error?: Error) {
    super({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: 'Relay limit reached',
      cause: error?.message,
    });
  }
}

export const createRelayLimitException = (error?: Error): Error => {
  return new RelayLimitException(error);
};
