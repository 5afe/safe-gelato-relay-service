import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { faker } from '@faker-js/faker';
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

  describe('/relay (POST)', () => {
    it('should return a 201 when the body is valid', async () => {
      const body = {
        chainId: faker.random.numeric(),
        target: faker.finance.ethereumAddress(),
        data: faker.datatype.hexadecimal(),
      };

      const response = await request(app.getHttpServer())
        .post('/relay')
        .send(body)
        .expect(201);

      expect(response.body).toStrictEqual(body);
    });

    it('should return a 400 error when the body is invalid', async () => {
      const body = {
        chainId: 'abc',
        target: faker.finance.ethereumAddress(),
        data: faker.datatype.hexadecimal(),
      };

      const response = await request(app.getHttpServer())
        .post('/relay')
        .send(body)
        .expect(400);

      const expectedError = {
        statusCode: 400,
        message: [
          {
            code: 'invalid_string',
            validation: 'regex',
            path: ['chainId'],
            message: 'Invalid',
          },
        ],
      };

      expect(response.body).toStrictEqual(expectedError);
    });
  });
});
