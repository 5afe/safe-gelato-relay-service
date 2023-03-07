import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

import { SponsoredCallDto } from './entities/sponsored-call.entity';
import { RelayLimitService } from './services/relay-limit.service';
import {
  ISponsorService,
  SponsorService,
} from '../../datasources/sponsor/sponsor.service.interface';
import { RelayResponse } from '@gelatonetwork/relay-sdk';

@Injectable()
export class RelayService {
  constructor(
    private readonly relayLimitService: RelayLimitService,
    @Inject(SponsorService) private readonly sponsorService: ISponsorService,
  ) {}

  /**
   * Relays transaction data via SponsorService `sponsoredCall`
   * Validation takes place through ZodValidationPipe in controller
   */
  async sponsoredCall(
    sponsoredCallDto: SponsoredCallDto,
  ): Promise<RelayResponse> {
    const { chainId, to, safeAddress } = sponsoredCallDto;

    // Check rate limit is not reached
    if (!this.relayLimitService.canRelay(chainId, to)) {
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
      throw new HttpException('Relay failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Increase the counter
    await this.relayLimitService.increment(chainId, safeAddress);

    // TODO: Add rate limit headers
    return response;
  }
}
