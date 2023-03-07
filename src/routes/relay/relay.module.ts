import { Module } from '@nestjs/common';
import { ThrottlerStorageService } from '@nestjs/throttler';

import { RelayController } from './relay.controller';
import { RelayService } from './relay.service';
import { RelayLimitService } from './services/relay-limit.service';

@Module({
  controllers: [RelayController],
  providers: [RelayService, RelayLimitService, ThrottlerStorageService],
})
export class RelayModule {}
