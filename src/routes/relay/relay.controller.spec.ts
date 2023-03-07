import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import * as request from 'supertest';
import * as axios from 'axios';

import { RelayModule } from './relay.module';
import configuration from '../../config/configuration';
import { MOCK_EXEC_TX_CALL_DATA } from '../../mocks/transaction-data.mock';
import { TestSponsorModule } from 'src/datasources/sponsor/__tests__/test.sponsor.module';
import {
  ISponsorService,
  SponsorService,
} from 'src/datasources/sponsor/sponsor.service.interface';

jest.mock('axios');

describe('RelayController', () => {
  let app: INestApplication;
  let sponsorService: ISponsorService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Features
        RelayModule,
        TestSponsorModule,
        // Common
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
      ],
    }).compile();

    sponsorService = moduleFixture.get<ISponsorService>(SponsorService);

    app = moduleFixture.createNestApplication();
    app.enableVersioning();

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/v1/relay (POST)', () => {
    it('should return a 201 when the body is valid', async () => {
      axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

      const relayServiceSpy = jest
        .spyOn(sponsorService, 'sponsoredCall')
        .mockImplementation(() => Promise.resolve({ taskId: '123' }));

      const body = {
        chainId: '5',
        to: faker.finance.ethereumAddress(),
        data: MOCK_EXEC_TX_CALL_DATA,
      };

      await request(app.getHttpServer())
        .post('/v1/relay')
        .send(body)
        .expect(201);

      expect(relayServiceSpy).toHaveBeenCalledTimes(1);
    });

    it('should return a 400 error when the chainId is invalid', async () => {
      axios.default.get = jest.fn().mockImplementation(() => Promise.reject());

      const relayServiceSpy = jest
        .spyOn(sponsorService, 'sponsoredCall')
        .mockImplementation(() => Promise.reject());

      const body = {
        chainId: '1337',
        to: faker.finance.ethereumAddress(),
        data: MOCK_EXEC_TX_CALL_DATA,
      };

      await request(app.getHttpServer())
        .post('/v1/relay')
        .send(body)
        .expect(400);

      expect(relayServiceSpy).not.toHaveBeenCalled();
    });

    it('should return a 400 error when the to address is invalid', async () => {
      axios.default.get = jest.fn().mockImplementation(() => Promise.reject());

      const relayServiceSpy = jest
        .spyOn(sponsorService, 'sponsoredCall')
        .mockImplementation(() => Promise.reject());

      const body = {
        chainId: '5',
        to: '0xinvalid',
        data: MOCK_EXEC_TX_CALL_DATA,
      };

      await request(app.getHttpServer())
        .post('/v1/relay')
        .send(body)
        .expect(400);

      expect(relayServiceSpy).not.toHaveBeenCalled();
    });

    it('should return a 400 error when the data is invalid', async () => {
      axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

      const relayServiceSpy = jest
        .spyOn(sponsorService, 'sponsoredCall')
        .mockImplementation(() => Promise.reject());

      const body = {
        chainId: '5',
        to: faker.finance.ethereumAddress(),
        data: '0x1',
      };

      await request(app.getHttpServer())
        .post('/v1/relay')
        .send(body)
        .expect(400);

      expect(relayServiceSpy).not.toHaveBeenCalled();
    });

    it('should return a 400 error when the gasLimit is invalid', async () => {
      axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

      const relayServiceSpy = jest.spyOn(sponsorService, 'sponsoredCall');

      const body = {
        chainId: '5',
        to: faker.finance.ethereumAddress(),
        data: MOCK_EXEC_TX_CALL_DATA,
        gasLimit: '1.23',
      };

      await request(app.getHttpServer())
        .post('/v1/relay')
        .send(body)
        .expect(400);

      expect(relayServiceSpy).not.toHaveBeenCalled();
    });

    it.todo('should return a 500 if the relayer throws');

    it.todo('should return a 429 if the rate limit is reached');

    it.todo('should not rate limit the same addresses on different chains');
  });

  describe('/v1/relay/:chainId/:address (GET)', () => {
    it('should return a 200 when the body is valid', async () => {
      const chainId = '5';
      const address = faker.finance.ethereumAddress();

      await request(app.getHttpServer())
        .get(`/v1/relay/${chainId}/${address}`)
        .expect(200);
    });

    it.todo('should increment the relay limit if limit has not been reached');

    it('should return a 400 error when the chainId is invalid', async () => {
      const chainId = '1337';
      const address = faker.finance.ethereumAddress();

      await request(app.getHttpServer())
        .get(`/v1/relay/${chainId}/${address}`)
        .expect(400);
    });

    it('should return a 400 error when the address is invalid', async () => {
      const chainId = '5';
      const address = '0x123';

      await request(app.getHttpServer())
        .get(`/v1/relay/${chainId}/${address}`)
        .expect(400);
    });

    it.todo('should not increment the relay limit if limit has been reached');
  });
});
