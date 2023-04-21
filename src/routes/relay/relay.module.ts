import { Module } from '@nestjs/common';

import { RelayController } from './relay.controller';
import { RelayService } from './relay.service';
import { RelayLimitService } from './services/relay-limit.service';

@Module({
  controllers: [RelayController],
  providers: [RelayService, RelayLimitService],
})
export class RelayModule {}
