import { Global, Module } from '@nestjs/common';

import { GatewaySafeInfoService } from './gateway.safe-info.service';
import { SafeInfoService } from './safe-info.service.interface';

@Global()
@Module({
  providers: [{ provide: SafeInfoService, useClass: GatewaySafeInfoService }],
  exports: [SafeInfoService],
})
export class SafeInfoModule {}
