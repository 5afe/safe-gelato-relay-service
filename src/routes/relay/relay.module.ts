import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { SafeInfoHelper } from '../common/safe/safe-info.helper';
import { RelayController } from './relay.controller';
import { RelayService } from './relay.service';

@Module({
  controllers: [RelayController],
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.getOrThrow<number>('throttle.ttl'),
        limit: configService.getOrThrow<number>('throttle.limit'),
      }),
    }),
  ],
  providers: [RelayService, SafeInfoHelper],
})
export class RelayModule {}
