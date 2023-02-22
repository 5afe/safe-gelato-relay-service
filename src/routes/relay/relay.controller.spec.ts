import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
        // TODO: Create test config module that provides mock environment variables
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/relay (GET)', () => {
    return request(app.getHttpServer())
      .get('/relay')
      .expect(200)
      .expect('Hello from the safe-gelato-relay-service!');
  });
});
