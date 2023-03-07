import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import * as request from 'supertest';
import * as axios from 'axios';

import { RelayModule } from './relay.module';
import { SupportedChainId } from '../../config/constants';
import { MOCK_EXEC_TX_CALL_DATA } from '../../mocks/transaction-data.mock';
import { TestSponsorModule } from '../../datasources/sponsor/__tests__/test.sponsor.module';
import {
  ISponsorService,
  SponsorService,
} from '../../datasources/sponsor/sponsor.service.interface';

jest.mock('axios');

describe('RelayController', () => {
  const THROTTLE_LIMIT = 5;

  let app: INestApplication;
  let mockSponsorService: ISponsorService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Features
        RelayModule,
        TestSponsorModule,
        // Common
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              relay: {
                ttl: 60 * 60,
                limit: THROTTLE_LIMIT,
              },
              gelato: {
                apiKey: {
                  [SupportedChainId.GOERLI]: 'faleApiKey5',
                  [SupportedChainId.GNOSIS_CHAIN]: 'faleApiKey100',
                },
              },
            }),
          ],
        }),
      ],
    }).compile();

    mockSponsorService = moduleFixture.get<ISponsorService>(SponsorService);

    app = moduleFixture.createNestApplication();
    app.enableVersioning();

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/v1/relay (POST)', () => {
    describe('Relayer', () => {
      it('should return a 201 when the body is valid', async () => {
        axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

        const sponsorServiceSpy = jest
          .spyOn(mockSponsorService, 'sponsoredCall')
          .mockImplementation(() => Promise.resolve({ taskId: '123' }));

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
          data: MOCK_EXEC_TX_CALL_DATA,
        };

        const result = await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(201);

        expect(result.body).toStrictEqual({ taskId: '123' });

        expect(sponsorServiceSpy).toHaveBeenCalledTimes(1);
      });

      it('should return a 500 if the relayer throws', async () => {
        axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

        const sponsorServiceSpy = jest
          .spyOn(mockSponsorService, 'sponsoredCall')
          .mockImplementation(() => Promise.reject());

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
          data: MOCK_EXEC_TX_CALL_DATA,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(500);

        expect(sponsorServiceSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('Validation', () => {
      it('should return a 422 error when the chainId is invalid', async () => {
        axios.default.get = jest
          .fn()
          .mockImplementation(() => Promise.reject());

        const sponsorServiceSpy = jest
          .spyOn(mockSponsorService, 'sponsoredCall')
          .mockImplementation(() => Promise.reject());

        const body = {
          chainId: '1337',
          to: faker.finance.ethereumAddress(),
          data: MOCK_EXEC_TX_CALL_DATA,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422);

        expect(sponsorServiceSpy).not.toHaveBeenCalled();
      });

      it('should return a 422 error when the to address is invalid', async () => {
        axios.default.get = jest
          .fn()
          .mockImplementation(() => Promise.reject());

        const sponsorServiceSpy = jest
          .spyOn(mockSponsorService, 'sponsoredCall')
          .mockImplementation(() => Promise.reject());

        const body = {
          chainId: '5',
          to: '0xinvalid',
          data: MOCK_EXEC_TX_CALL_DATA,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422);

        expect(sponsorServiceSpy).not.toHaveBeenCalled();
      });

      it('should return a 422 error when the data is invalid', async () => {
        axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

        const sponsorServiceSpy = jest
          .spyOn(mockSponsorService, 'sponsoredCall')
          .mockImplementation(() => Promise.reject());

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
          data: '0x1',
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422);

        expect(sponsorServiceSpy).not.toHaveBeenCalled();
      });

      it('should return a 422 error when the gasLimit is invalid', async () => {
        axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

        const sponsorServiceSpy = jest.spyOn(
          mockSponsorService,
          'sponsoredCall',
        );

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
          data: MOCK_EXEC_TX_CALL_DATA,
          gasLimit: '1.23',
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422);

        expect(sponsorServiceSpy).not.toHaveBeenCalled();
      });
    });

    describe('Rate limiting', () => {
      it('should return a 429 if the rate limit is reached', async () => {
        axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

        const sponsorServiceSpy = jest.spyOn(
          mockSponsorService,
          'sponsoredCall',
        );

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
          data: MOCK_EXEC_TX_CALL_DATA,
        };

        await Promise.all(
          Array.from({ length: THROTTLE_LIMIT }, () => {
            return request(app.getHttpServer())
              .post('/v1/relay')
              .send(body)
              .expect(201);
          }),
        );

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(429);

        expect(sponsorServiceSpy).toHaveBeenCalledTimes(THROTTLE_LIMIT);
      });

      it('should not rate limit the same addresses on different chains', async () => {
        axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

        const sponsorServiceSpy = jest.spyOn(
          mockSponsorService,
          'sponsoredCall',
        );

        const body = {
          to: faker.finance.ethereumAddress(),
          data: MOCK_EXEC_TX_CALL_DATA,
          chainId: '5',
        };

        // Reach rate limit
        await Promise.all(
          Array.from({ length: THROTTLE_LIMIT }, () => {
            return request(app.getHttpServer())
              .post('/v1/relay')
              .send(body)
              .expect(201);
          }),
        );

        await request(app.getHttpServer())
          .post('/v1/relay')
          // Different chainId
          .send({ ...body, chainId: '100' })
          .expect(201);

        // Called on chainId 5 until limit reached and then once on 100
        expect(sponsorServiceSpy).toHaveBeenCalledTimes(THROTTLE_LIMIT + 1);
      });
    });
  });

  describe('/v1/relay/:chainId/:address (GET)', () => {
    describe('Rate limiter', () => {
      it('should return a 200 when the body is valid', async () => {
        const chainId = '5';
        const address = faker.finance.ethereumAddress();

        await request(app.getHttpServer())
          .get(`/v1/relay/${chainId}/${address}`)
          .expect(200);
      });

      it('should increment the relay limit if limit has not been reached', async () => {
        const chainId = '5';
        const address = faker.finance.ethereumAddress();

        axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

        const body = {
          chainId,
          to: address,
          data: MOCK_EXEC_TX_CALL_DATA,
        };

        await request(app.getHttpServer()).post('/v1/relay').send(body);

        const result = await request(app.getHttpServer())
          .get(`/v1/relay/${chainId}/${address}`)
          .expect(200);

        expect(result.body).toStrictEqual({
          remaining: 4,
          expiresAt: expect.any(Number),
        });
      });

      it('should not return negative limits more requests were made than the limit', async () => {
        const chainId = '5';
        const address = faker.finance.ethereumAddress();

        axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

        const body = {
          chainId,
          to: address,
          data: MOCK_EXEC_TX_CALL_DATA,
        };

        // Request more than the limit
        await Promise.all(
          Array.from({ length: THROTTLE_LIMIT }, () => {
            return request(app.getHttpServer())
              .post('/v1/relay')
              .send(body)
              .expect(201);
          }),
        );

        const result = await request(app.getHttpServer())
          .get(`/v1/relay/${chainId}/${address}`)
          .expect(200);

        expect(result.body).toStrictEqual({
          remaining: 0,
          expiresAt: expect.any(Number),
        });
      });
    });

    describe('Validation', () => {
      it('should return a 422 error when the chainId is invalid', async () => {
        const chainId = '1337';
        const address = faker.finance.ethereumAddress();

        await request(app.getHttpServer())
          .get(`/v1/relay/${chainId}/${address}`)
          .expect(422);
      });

      it('should return a 422 error when the address is invalid', async () => {
        const chainId = '5';
        const address = '0x123';

        await request(app.getHttpServer())
          .get(`/v1/relay/${chainId}/${address}`)
          .expect(422);
      });
    });
  });
});
