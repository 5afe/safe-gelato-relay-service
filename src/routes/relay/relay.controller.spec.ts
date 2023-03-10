import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import * as request from 'supertest';
import { getMultiSendCallOnlyDeployment } from '@safe-global/safe-deployments';

import { RelayModule } from './relay.module';
import { SupportedChainId } from '../../config/constants';
import {
  MOCK_EXEC_TX_CALL_DATA,
  MOCK_FAKE_CALL_DATA,
  MOCK_MULTISEND_CALL_DATA_2_EXEC_TXS_DIFF_RECIPIENTS,
  MOCK_MULTISEND_CALL_DATA_2_EXEC_TXS_SAME_RECIPIENT,
  MOCK_MULTISEND_CALL_DATA_2_FAKE_TXS_SAME_RECIPIENT,
} from '../../mocks/transaction-data.mock';
import { TestSponsorModule } from '../../datasources/sponsor/__tests__/test.sponsor.module';
import {
  ISponsorService,
  SponsorService,
} from '../../datasources/sponsor/sponsor.service.interface';
import { TestSafeInfoModule } from '../../datasources/safe-info/__tests__/test.safe-info.module';
import {
  ISafeInfoService,
  SafeInfoService,
} from '../../datasources/safe-info/safe-info.service.interface';

describe('RelayController', () => {
  const THROTTLE_TTL = 60 * 60;
  const THROTTLE_LIMIT = 5;

  let app: INestApplication;
  let mockSponsorService: ISponsorService;
  let mockSafeInfoService: ISafeInfoService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Features
        RelayModule,
        TestSponsorModule,
        TestSafeInfoModule,
        // Common
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              relay: {
                ttl: THROTTLE_TTL,
                limit: THROTTLE_LIMIT,
              },
              gelato: {
                apiKey: {
                  [SupportedChainId.GOERLI]: faker.random.word(),
                  [SupportedChainId.GNOSIS_CHAIN]: faker.random.word(),
                },
              },
            }),
          ],
        }),
      ],
    }).compile();

    mockSponsorService = moduleFixture.get<ISponsorService>(SponsorService);
    mockSafeInfoService = moduleFixture.get<ISafeInfoService>(SafeInfoService);

    app = moduleFixture.createNestApplication();
    app.enableVersioning();

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/v1/relay (POST)', () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const MULTI_SEND_CALL_ONLY_ADDRESS = getMultiSendCallOnlyDeployment({
      network: '5',
    })!.defaultAddress;

    describe('Relayer', () => {
      it('should return a 201 when the body is a valid execTransaction call', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
        );

        (mockSponsorService.sponsoredCall as jest.Mock).mockImplementation(() =>
          Promise.resolve({ taskId: '123' }),
        );

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
          data: MOCK_EXEC_TX_CALL_DATA,
          gasLimit: '123',
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(201, {
            taskId: '123',
          });
      });

      it('should return a 201 when the body is a valid multiSend call', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
        );

        (mockSponsorService.sponsoredCall as jest.Mock).mockImplementation(() =>
          Promise.resolve({ taskId: '123' }),
        );

        const body = {
          chainId: '5',
          to: MULTI_SEND_CALL_ONLY_ADDRESS,
          data: MOCK_MULTISEND_CALL_DATA_2_EXEC_TXS_SAME_RECIPIENT,
          gasLimit: '123',
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(201, {
            taskId: '123',
          });
      });

      it('should return a 500 if the relayer throws', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
        );

        (mockSponsorService.sponsoredCall as jest.Mock).mockImplementation(() =>
          Promise.reject(),
        );

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
          data: MOCK_EXEC_TX_CALL_DATA,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(500, {
            statusCode: 500,
            message: 'Relay failed',
          });
      });
    });

    describe('Validation', () => {
      it('should return a 422 error when the chainId is invalid', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          false,
        );

        const body = {
          chainId: '1337', // Invalid chainId
          to: faker.finance.ethereumAddress(),
          data: MOCK_EXEC_TX_CALL_DATA,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422, {
            statusCode: 422,
            message: 'Validation failed',
          });
      });

      it('should return a 422 error when the to address is invalid', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          false,
        );

        const body = {
          chainId: '5',
          to: '0xinvalid', // Not valid
          data: MOCK_EXEC_TX_CALL_DATA,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422, {
            statusCode: 422,
            message: 'Validation failed',
          });
      });

      it('should return a 422 error when the data is not an execTransaction or multiSend call', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
        );

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
          data: MOCK_FAKE_CALL_DATA, // Not an execTransaction or multiSend call
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422, {
            statusCode: 422,
            message: 'Validation failed',
          });
      });

      it('should return a 422 error when the data is an execTransaction to a non-Safe', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          false, // Not a Safe
        );

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
          data: MOCK_EXEC_TX_CALL_DATA,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422, {
            statusCode: 422,
            message: 'Validation failed',
          });
      });

      it('should return a 422 error when the data is a multiSend containing non-execTransaction transactions', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          false,
        );

        const body = {
          chainId: '5',
          to: MULTI_SEND_CALL_ONLY_ADDRESS,
          data: MOCK_MULTISEND_CALL_DATA_2_FAKE_TXS_SAME_RECIPIENT,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422, {
            statusCode: 422,
            message: 'Validation failed',
          });
      });

      it('should return a 422 error when the data is a multiSend with execTransactions to varying recipients', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          false,
        );

        const body = {
          chainId: '5',
          to: MULTI_SEND_CALL_ONLY_ADDRESS,
          data: MOCK_MULTISEND_CALL_DATA_2_EXEC_TXS_DIFF_RECIPIENTS,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422, {
            statusCode: 422,
            message: 'Validation failed',
          });
      });

      it('should return a 422 error when the data is a multiSend from an invalid MultiSend deployment', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          false,
        );

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(), // Invalid deployment
          data: MOCK_MULTISEND_CALL_DATA_2_EXEC_TXS_SAME_RECIPIENT,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422, {
            statusCode: 422,
            message: 'Validation failed',
          });
      });

      it('should return a 422 error when the data is a multiSend to a non-Safe', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          false, // Not a Safe
        );

        const body = {
          chainId: '5',
          to: MULTI_SEND_CALL_ONLY_ADDRESS,
          data: MOCK_MULTISEND_CALL_DATA_2_EXEC_TXS_SAME_RECIPIENT,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422, {
            statusCode: 422,
            message: 'Validation failed',
          });
      });

      it('should return a 422 error when the gasLimit is invalid', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
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
          .expect(422, {
            statusCode: 422,
            message: 'Validation failed',
          });
      });
    });

    describe('Rate limiting', () => {
      it('should return a 429 if the rate limit is reached', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
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
          .expect(429, {
            statusCode: 429,
            message: 'Relay limit reached',
          });

        expect(mockSponsorService.sponsoredCall).toHaveBeenCalledTimes(
          THROTTLE_LIMIT,
        );
      });

      it('should not rate limit the same addresses on different chains', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
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
        expect(mockSponsorService.sponsoredCall).toHaveBeenCalledTimes(
          THROTTLE_LIMIT + 1,
        );
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
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
        );

        const chainId = '5';
        const address = faker.finance.ethereumAddress();

        const body = {
          chainId,
          to: address,
          data: MOCK_EXEC_TX_CALL_DATA,
        };

        await request(app.getHttpServer()).post('/v1/relay').send(body);

        await request(app.getHttpServer())
          .get(`/v1/relay/${chainId}/${address}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toStrictEqual({
              remaining: 4,
              expiresAt: expect.any(Number),
            });
          });
      });

      it('should not return negative limits more requests were made than the limit', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
        );

        const chainId = '5';
        const address = faker.finance.ethereumAddress();

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

        await request(app.getHttpServer())
          .get(`/v1/relay/${chainId}/${address}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toStrictEqual({
              remaining: 0,
              expiresAt: expect.any(Number),
            });
          });
      });
    });

    describe('Validation', () => {
      it('should return a 422 error when the chainId is invalid', async () => {
        const chainId = '1337';
        const address = faker.finance.ethereumAddress();

        await request(app.getHttpServer())
          .get(`/v1/relay/${chainId}/${address}`)
          .expect(422, {
            statusCode: 422,
            message: 'Validation failed',
          });
      });

      it('should return a 422 error when the address is invalid', async () => {
        const chainId = '5';
        const address = '0x123';

        await request(app.getHttpServer())
          .get(`/v1/relay/${chainId}/${address}`)
          .expect(422, {
            statusCode: 422,
            message: 'Validation failed',
          });
      });
    });
  });
});
