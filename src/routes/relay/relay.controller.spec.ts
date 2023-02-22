import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import * as request from 'supertest';

import { RelayModule } from './relay.module';
import configuration from '../../config/configuration';
import { RelayService } from './relay.service';

describe('RelayController', () => {
  let app: INestApplication;
  let relayService: RelayService;

  beforeEach(async () => {
    // TODO: Create test module that provides mock environment variables and versioning to mirror `main.ts`
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Features
        RelayModule,
        // Common
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
      ],
    }).compile();

    relayService = moduleFixture.get<RelayService>(RelayService);

    app = moduleFixture.createNestApplication();
    app.enableVersioning();

    await app.init();
  });

  describe('/v1/relay (POST)', () => {
    it('should return a 201 when the body is valid', async () => {
      const taskId = '123';

      const relayServiceSpy = jest
        .spyOn(relayService, 'sponsoredCall')
        .mockImplementation(() => Promise.resolve({ taskId }));

      const body = {
        chainId: '5',
        target: faker.finance.ethereumAddress(),
        data: faker.datatype.hexadecimal(),
      };

      const response = await request(app.getHttpServer())
        .post('/v1/relay')
        .send(body)
        .expect(201);

      expect(relayServiceSpy).toHaveBeenCalledTimes(1);

      expect(response.body).toStrictEqual({ taskId });
    });

    it('should return a 400 error when the body is invalid', async () => {
      const relayServiceSpy = jest
        .spyOn(relayService, 'sponsoredCall')
        .mockImplementation(() => Promise.reject());

      const body = {
        chainId: 'abc',
        target: faker.finance.ethereumAddress(),
        data: faker.datatype.hexadecimal(),
      };

      const response = await request(app.getHttpServer())
        .post('/v1/relay')
        .send(body)
        .expect(400);

      const expectedError = {
        statusCode: 400,
        message: [
          {
            code: 'invalid_enum_value',
            message: "Invalid enum value. Expected '5' | '100', received 'abc'",
            options: ['5', '100'],
            path: ['chainId'],
            received: 'abc',
          },
        ],
      };

      expect(relayServiceSpy).not.toHaveBeenCalled();

      expect(response.body).toStrictEqual(expectedError);
    });
  });
});
