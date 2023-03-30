import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

import { SponsoredCallDto } from './entities/sponsored-call.entity';
import { RelayLimitService } from './services/relay-limit.service';
import {
  ISponsorService,
  SponsorService,
} from '../../datasources/sponsor/sponsor.service.interface';
import { RelayResponse } from '@gelatonetwork/relay-sdk';
import {
  ILoggingService,
  LoggingService,
} from '../common/logging/logging.interface';

@Injectable()
export class RelayService {
  constructor(
    private readonly relayLimitService: RelayLimitService,
    @Inject(SponsorService) private readonly sponsorService: ISponsorService,
    @Inject(LoggingService) private readonly loggingService: ILoggingService,
  ) {}

  /**
   * Relays transaction data via SponsorService `sponsoredCall`
   * Validation takes place through ZodValidationPipe in controller
   */
  async sponsoredCall(
    sponsoredCallDto: SponsoredCallDto,
  ): Promise<RelayResponse> {
    const { chainId, limitAddresses } = sponsoredCallDto;

    // Check rate limit is not reached
    if (!this.relayLimitService.canRelay(chainId, limitAddresses)) {
      this.loggingService.error(
        'Transaction can not be relayed because the address relay limit was reached.',
      );
      throw new HttpException(
        'Relay limit reached',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    let response: RelayResponse;

    try {
      // Relay
      response = await this.sponsorService.sponsoredCall(sponsoredCallDto);
    } catch (err) {
      this.loggingService.error(
        'Unexpected error from Gelato sponsored call: `%s`',
        err,
      );
      throw new HttpException('Relay failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Increase the counter
    await this.relayLimitService.increment(chainId, limitAddresses);

    // TODO: Add rate limit headers
    return response;
  }
}
