import { Controller, Get } from '@nestjs/common';

import { RelayService } from './relay.service';

@Controller({
  path: 'relay',
})
export class RelayController {
  constructor(private readonly relayService: RelayService) {}

  @Get()
  getHello(): string {
    return this.relayService.getHello();
  }
}
