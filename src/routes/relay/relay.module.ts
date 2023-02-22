import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { SafeInfoHelper } from '../common/safe/safe-info.helper';
import { RelayController } from './relay.controller';
import { RelayService } from './relay.service';

@Module({
  imports: [HttpModule],
  controllers: [RelayController],
  providers: [RelayService, SafeInfoHelper],
})
export class RelayModule {}
