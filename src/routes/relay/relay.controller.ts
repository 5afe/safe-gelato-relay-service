import { RelayResponse } from '@gelatonetwork/relay-sdk';
import { Body, Controller, Post, UsePipes } from '@nestjs/common';

import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import { SponsoredCallSchema } from './entities/schemas/sponsored-call.schema';
import { SponsoredCallDto } from './entities/sponsored-call.entity';
import { RelayService } from './relay.service';

@Controller({
  version: '1',
})
export class RelayController {
  constructor(private readonly relayService: RelayService) {}
  @Post('relay')
  @UsePipes(new ZodValidationPipe(SponsoredCallSchema))
  sponsoredCall(
    @Body() sponsoredCallDto: SponsoredCallDto,
  ): Promise<RelayResponse> {
    return this.relayService.sponsoredCall(sponsoredCallDto);
  }
}
