import { Module } from '@nestjs/common';

import { RelayController } from './relay.controller';
import { RelayService } from './relay.service';

@Module({
  controllers: [RelayController],
  providers: [RelayService],
})
export class RelayModule {}
