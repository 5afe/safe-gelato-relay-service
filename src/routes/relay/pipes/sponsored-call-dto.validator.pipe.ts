import { Inject, Injectable, PipeTransform } from '@nestjs/common';

import {
  ISafeInfoService,
  SafeInfoService,
} from '../../../datasources/safe-info/safe-info.service.interface';
import { SponsoredCallSchema } from '../entities/schema/sponsored-call.schema';
import { isCreateProxyWithNonceCalldata } from '../entities/schema/transactions/createProxyWithNonce';
import { SponsoredCallDto } from '../entities/sponsored-call.entity';

export class SponsoredCallValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

@Injectable()
export class SponsoredCallDtoValidatorPipe implements PipeTransform {
  private readonly schema = SponsoredCallSchema;

  constructor(
    @Inject(SafeInfoService) private safeInfoService: ISafeInfoService,
  ) {}

  async transform<T>(value: T): Promise<SponsoredCallDto> {
    const result = await this.schema.safeParseAsync(value);

    if (!result.success) {
      throw new SponsoredCallValidationError('Validation failed');
    }

    if (!isCreateProxyWithNonceCalldata(result.data.data)) {
      const isSafeContract = await this.safeInfoService.isSafeContract(
        result.data.chainId,
        // Safe transactions only every have one limit address
        result.data.limitAddresses[0],
      );

      if (!isSafeContract) {
        throw new SponsoredCallValidationError(
          'Safe address is not a valid Safe contract',
        );
      }
    }

    return result.data;
  }
}
