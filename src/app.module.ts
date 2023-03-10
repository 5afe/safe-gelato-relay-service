import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './config/configuration';
import { NetworkModule } from './datasources/network/network.module';
import { SafeInfoModule } from './datasources/safe-info/safe-info.module';
import { SponsorModule } from './datasources/sponsor/sponsor.module';
import { RelayModule } from './routes/relay/relay.module';

@Module({
  imports: [
    // Features
    RelayModule,
    SponsorModule,
    SafeInfoModule,
    // Common
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    NetworkModule,
  ],
})
export class AppModule {}
