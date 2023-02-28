import { BadRequestException, HttpStatus } from '@nestjs/common';

import { RelayLimitException } from './relay-limit.exception';

describe('RelayLimitException', () => {
  it('should create a basic exception', () => {
    const error = new RelayLimitException(new Error());

    expect(error).toBeInstanceOf(BadRequestException);

    expect(error.message).toBe('Relay limit reached');
    expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);

    expect(error.getResponse()).toStrictEqual({
      statusCode: 429,
      message: 'Relay limit reached',
      cause: '',
    });
  });

  it('should add the exception cause', () => {
    const error = new RelayLimitException(new Error('Error message'));

    expect(error).toBeInstanceOf(BadRequestException);

    expect(error.message).toBe('Relay limit reached');
    expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);

    expect(error.getResponse()).toStrictEqual({
      statusCode: 429,
      message: 'Relay limit reached',
      cause: 'Error message',
    });
  });
});
