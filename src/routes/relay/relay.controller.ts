import { RelayResponse } from '@gelatonetwork/relay-sdk';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { ZodValidationPipe } from '../../pipes/zod/zod-validation.pipe';
import { ZodAsyncValidationPipe } from '../../pipes/zod/zod-async-validation.pipe';
import { AddressSchema } from '../common/schema/address.schema';
import { SponsoredCallSchema } from './entities/schema/sponsored-call.schema';
import { SponsoredCallDto } from './entities/sponsored-call.entity';
import { RelayService } from './relay.service';
import { RelayThrottlerGuard } from './relay.guard';
import { ChainIdSchema } from '../common/schema/chain-id.schema';

@Controller({
  version: '1',
})
export class RelayController {
  constructor(private readonly relayService: RelayService) {}

  @Post('relay')
  @UseGuards(RelayThrottlerGuard)
  sponsoredCall(
    // async as we validate that the address is a Safe via the gateway
    @Body(new ZodAsyncValidationPipe(SponsoredCallSchema))
    sponsoredCallDto: SponsoredCallDto,
  ): Promise<RelayResponse> {
    return this.relayService.sponsoredCall(sponsoredCallDto);
  }

  @Get('relay/:chainId/:target')
  getRelayLimit(
    @Param('chainId', new ZodValidationPipe(ChainIdSchema))
    chainId: string,
    @Param('target', new ZodValidationPipe(AddressSchema))
    target: string,
  ): {
    remaining: number;
    expiresAt?: number;
  } {
    return this.relayService.getRelayLimit(chainId, target);
  }
}
