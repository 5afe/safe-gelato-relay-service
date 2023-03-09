import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './config/configuration';
import { SponsorModule } from './datasources/sponsor/sponsor.module';
import { RelayModule } from './routes/relay/relay.module';

@Module({
  imports: [
    // Features
    RelayModule,
    SponsorModule,
    // Common
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
  ],
})
export class AppModule {}
