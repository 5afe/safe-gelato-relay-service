import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { ClsModule, ClsMiddleware } from 'nestjs-cls';

import configuration from './config/configuration';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { RelayModule } from './routes/relay/relay.module';
import { RequestScopedLoggingModule } from './routes/common/logging/logging.module';

@Module({
  imports: [
    // Features
    RelayModule,
    // Common
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    // Register the ClsModule and automatically mount the ClsMiddleware
    ClsModule.forRoot({
      global: true,
      middleware: {
        generateId: true,
        idGenerator: () => uuidv4(),
      },
    }),
    RequestScopedLoggingModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ClsMiddleware, LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
