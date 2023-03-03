import { RelayResponse } from '@gelatonetwork/relay-sdk';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { ZodValidationPipe } from '../../pipes/zod/zod-validation.pipe';
import { AddressSchema } from '../common/schema/address.schema';
import { SponsoredCallSchema } from './entities/schema/sponsored-call.schema';
import { SponsoredCallDto } from './entities/sponsored-call.entity';
import { RelayService } from './relay.service';
import { ChainIdSchema } from '../common/schema/chain-id.schema';
import { RelayLimitService } from './services/relay-limit.service';

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
  sponsoredCall(
    @Body(new ZodValidationPipe(SponsoredCallSchema))
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
  ): {
    remaining: number;
    expiresAt?: number;
  } {
    return this.relayLimitService.getRelayLimit(chainId, address);
  }
}
