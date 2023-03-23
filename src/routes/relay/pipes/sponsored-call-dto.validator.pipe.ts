import {
  PipeTransform,
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';

import {
  ISafeInfoService,
  SafeInfoService,
} from '../../../datasources/safe-info/safe-info.service.interface';
import { SponsoredCallSchema } from '../entities/schema/sponsored-call.schema';
import { isSetupCall } from '../entities/schema/sponsored-call.schema.helper';
import { SponsoredCallDto } from '../entities/sponsored-call.entity';

@Injectable()
export class SponsoredCallDtoValidatorPipe implements PipeTransform {
  private readonly schema = SponsoredCallSchema;

  constructor(
    @Inject(SafeInfoService) private safeInfoService: ISafeInfoService,
  ) {}

  async transform<T>(value: T): Promise<SponsoredCallDto> {
    const result = await this.schema.safeParseAsync(value);

    if (!result.success) {
      throw new HttpException(
        'Validation failed',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (!isSetupCall(result.data.data)) {
      const isSafeContract = await this.safeInfoService.isSafeContract(
        result.data.chainId,
        // Safe transactions only every have one limit address
        result.data.limitAddresses[0],
      );

      if (!isSafeContract) {
        throw new HttpException(
          'Safe address is not a valid Safe contract',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    return result.data;
  }
}
