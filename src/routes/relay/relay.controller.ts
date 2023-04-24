import { RelayResponse } from '@gelatonetwork/relay-sdk';
import { Body, Controller, Get, Param, Post, UseFilters } from '@nestjs/common';

import { ZodValidationPipe } from '../../pipes/zod/zod-validation.pipe';
import { AddressSchema } from '../common/schema/address.schema';
import { SponsoredCallDtoValidatorPipe } from './pipes/sponsored-call-dto.validator.pipe';
import { SponsoredCallDto } from './entities/sponsored-call.entity';
import { RelayService } from './relay.service';
import { ChainIdSchema } from '../common/schema/chain-id.schema';
import { RelayLimitService } from './services/relay-limit.service';
import { SponsoredCallValidationExceptionFilter } from './filters/sponsored-call-validation.exception-filter';

@Controller({
  version: '1',
  path: 'relay',
})
export class RelayController {
  constructor(
    private readonly relayService: RelayService,
    private readonly relayLimitService: RelayLimitService,
  ) {}

  @Post()
  @UseFilters(SponsoredCallValidationExceptionFilter)
  sponsoredCall(
    @Body(SponsoredCallDtoValidatorPipe)
    sponsoredCallDto: SponsoredCallDto,
  ): Promise<RelayResponse> {
    return this.relayService.sponsoredCall(sponsoredCallDto);
  }

  @Get(':chainId/:address')
  getRelayLimit(
    @Param('chainId', new ZodValidationPipe(ChainIdSchema))
    chainId: string,
    @Param('address', new ZodValidationPipe(AddressSchema))
    address: string,
  ): Promise<{
    remaining: number;
    limit: number;
  }> {
    return this.relayLimitService.getRelayLimit(chainId, address);
  }

  @Get('health')
  getHealth() {
    return;
  }
}
