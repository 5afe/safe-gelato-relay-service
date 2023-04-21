import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { ClsMiddleware, ClsModule } from 'nestjs-cls';

import configuration from './config/configuration';
import { NetworkModule } from './datasources/network/network.module';
import { SafeInfoModule } from './datasources/safe-info/safe-info.module';
import { NotFoundLoggerMiddleware } from './middleware/not-found-logger.middleware';
import { SponsorModule } from './datasources/sponsor/sponsor.module';
import { RelayModule } from './routes/relay/relay.module';
import { RequestScopedLoggingModule } from './routes/common/logging/logging.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RouteLoggerInterceptor } from './routes/common/interceptors/route-logger.interceptor';
import { CacheModule } from './datasources/cache/cache.module';

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
    CacheModule,
    NetworkModule,
    // Module for storing and reading from the async local storage
    ClsModule.forRoot({
      global: true,
      middleware: {
        generateId: true,
        idGenerator: () => uuidv4(),
      },
    }),
    RequestScopedLoggingModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RouteLoggerInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      // The ClsMiddleware needs to be applied before the LoggerMiddleware
      .apply(ClsMiddleware, NotFoundLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
