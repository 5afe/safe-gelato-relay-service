import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import * as request from 'supertest';

import { RelayModule } from './relay.module';
import configuration from '../../config/configuration';

describe('RelayController', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Features
        RelayModule,
        // Common
        // TODO: Create test config module that provides mock environment variables and throttler
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        ThrottlerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            ttl: configService.getOrThrow<number>('throttle.ttl'),
            limit: configService.getOrThrow<number>('throttle.limit'),
          }),
        }),
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/relay (GET)', () => {
    it('should return 200', () => {
      return request(app.getHttpServer())
        .get('/relay')
        .expect(200)
        .expect('Hello from the safe-gelato-relay-service!');
    });

    it('should return a 429 when breaching rate limit', async () => {
      await Promise.all(
        Array.from({ length: 5 }, () =>
          request(app.getHttpServer()).get('/relay'),
        ),
      );

      await request(app.getHttpServer()).get('/relay').expect(429);
    });
  });
});
