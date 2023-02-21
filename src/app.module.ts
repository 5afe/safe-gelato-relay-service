import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './config/configuration';
import { RelayModule } from './routes/relay/relay.module';

@Module({
  imports: [
    // Features
    RelayModule,
    // Common
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
  ],
})
export class AppModule {}
