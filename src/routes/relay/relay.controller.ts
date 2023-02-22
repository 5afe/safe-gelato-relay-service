import { Body, Controller, Get, Post, UsePipes } from '@nestjs/common';

import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import { SponsoredCallSchema } from './entities/schemas/sponsored-call.schema';
import { SponsoredCallDto } from './entities/sponsored-call.entity';
import { RelayService } from './relay.service';

@Controller({
  path: 'relay',
  version: '1',
})
export class RelayController {
  constructor(private readonly relayService: RelayService) {}

  @Get()
  getHello(): string {
    return this.relayService.getHello();
  }

  @Post()
  @UsePipes(new ZodValidationPipe(SponsoredCallSchema))
  sponsoredCall(@Body() sponsoredCallDto: SponsoredCallDto): SponsoredCallDto {
    return this.relayService.sponsoredCall(sponsoredCallDto);
  }
}
