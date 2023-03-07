import { Module } from '@nestjs/common';
import { ThrottlerStorageService } from '@nestjs/throttler';

import { SponsorModule } from '../../datasources/sponsor/sponsor.module';
import { RelayController } from './relay.controller';
import { RelayService } from './relay.service';
import { RelayLimitService } from './services/relay-limit.service';

@Module({
  imports: [SponsorModule],
  controllers: [RelayController],
  providers: [RelayService, RelayLimitService, ThrottlerStorageService],
})
export class RelayModule {}
