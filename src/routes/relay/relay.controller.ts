import { RelayResponse } from '@gelatonetwork/relay-sdk';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';

import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import { AddressSchema } from '../common/schema/address.schema';
import { SponsoredCallSchema } from './entities/schema/sponsored-call.schema';
import { SponsoredCallDto } from './entities/sponsored-call.entity';
import { RelayService } from './relay.service';
import { RelayThrottlerGuard } from './relay.guard';

@Controller({
  version: '1',
})
export class RelayController {
  constructor(private readonly relayService: RelayService) {}

  @Post('relay')
  @UseGuards(RelayThrottlerGuard)
  @UsePipes(new ZodValidationPipe(SponsoredCallSchema))
  sponsoredCall(
    @Body() sponsoredCallDto: SponsoredCallDto,
  ): Promise<RelayResponse> {
    return this.relayService.sponsoredCall(sponsoredCallDto);
  }

  @Get('relay/:target')
  @UsePipes(new ZodValidationPipe(AddressSchema))
  getRelayLimit(@Param('target') target: string): {
    remainingRelays: number;
    expiresAt?: number;
  } {
    return this.relayService.getRelayLimit(target);
  }
}
