import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import * as request from 'supertest';
import {
  getMultiSendCallOnlyDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
} from '@safe-global/safe-deployments';
import { ClsModule } from 'nestjs-cls';
import { ethers } from 'ethers';

import { RelayModule } from './relay.module';
import { SupportedChainId } from '../../config/constants';
import {
  getMockCreateProxyWithNonceCalldata,
  getMockExecTransactionCalldata,
  getMockMultiSendCalldata,
  MOCK_UNSUPPORTED_CALLDATA,
} from '../../__mocks__/transaction-calldata.mock';
import { TestLoggingModule } from '../common/logging/__tests__/test.logging.module';
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
import { TestAppProvider } from '../../app.provider';
import { TestCacheModule } from '../../datasources/cache/__tests__/test.cache.module';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS = getMultiSendCallOnlyDeployment({
  network: '5',
})!.defaultAddress;

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const GOERLI_L1_SINGLETON_DEPLOYMENT_ADDRESS = getSafeSingletonDeployment({
  network: '5',
})!.defaultAddress;

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const GOERLI_L2_SINGLETON_DEPLOYMENT_ADDRESS = getSafeL2SingletonDeployment({
  network: '5',
})!.defaultAddress;

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const GOERLI_PROXY_FACTORY_DEPLOYMENT_ADDRESS = getProxyFactoryDeployment({
  network: '5',
})!.defaultAddress;

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
        TestCacheModule,
        // Register the ClsModule and automatically mount the ClsMiddleware
        ClsModule.forRoot({
          global: true,
          middleware: {
            generateId: true,
          },
        }),
        TestLoggingModule,
      ],
    }).compile();

    mockSponsorService = moduleFixture.get<ISponsorService>(SponsorService);
    mockSafeInfoService = moduleFixture.get<ISafeInfoService>(SafeInfoService);

    app = await new TestAppProvider().provide(moduleFixture);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/v1/relay (POST)', () => {
    describe('Relayer', () => {
      it('should return a 201 when the body is a valid execTransaction call', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
        );

        (mockSponsorService.sponsoredCall as jest.Mock).mockImplementation(() =>
          Promise.resolve({ taskId: '123' }),
        );

        const to = faker.finance.ethereumAddress();
        const data = await getMockExecTransactionCalldata({ to, value: 0 });

        const body = {
          chainId: '5',
          to,
          data,
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

        const execTransaction1 = await getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 0,
        });

        const execTransaction2 = await getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 0,
        });

        const safe = faker.finance.ethereumAddress();

        // 2 x `execTransaction` calls of the same Safe
        const data = await getMockMultiSendCalldata([
          { to: safe, data: execTransaction1, value: 0 },
          { to: safe, data: execTransaction2, value: 0 },
        ]);

        const body = {
          chainId: '5',
          to: GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS,
          data,
          gasLimit: '123',
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(201, {
            taskId: '123',
          });
      });

      it('should return a 201 when the body is a valid L1 createProxyWithNonce call', async () => {
        (mockSponsorService.sponsoredCall as jest.Mock).mockImplementation(() =>
          Promise.resolve({ taskId: '123' }),
        );

        const data = await getMockCreateProxyWithNonceCalldata({
          owners: [
            faker.finance.ethereumAddress(),
            faker.finance.ethereumAddress(),
          ],
          threshold: 1,
          singleton: GOERLI_L1_SINGLETON_DEPLOYMENT_ADDRESS,
        });

        const body = {
          chainId: '5',
          to: GOERLI_PROXY_FACTORY_DEPLOYMENT_ADDRESS,
          data,
          gasLimit: '123',
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(201, {
            taskId: '123',
          });
      });

      it('should return a 201 when the body is a valid L2 createProxyWithNonce call', async () => {
        (mockSponsorService.sponsoredCall as jest.Mock).mockImplementation(() =>
          Promise.resolve({ taskId: '123' }),
        );

        const data = await getMockCreateProxyWithNonceCalldata({
          owners: [
            faker.finance.ethereumAddress(),
            faker.finance.ethereumAddress(),
          ],
          threshold: 1,
          singleton: GOERLI_L2_SINGLETON_DEPLOYMENT_ADDRESS,
        });

        const body = {
          chainId: '5',
          to: GOERLI_PROXY_FACTORY_DEPLOYMENT_ADDRESS,
          data,
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

        const to = faker.finance.ethereumAddress();
        const data = await getMockExecTransactionCalldata({ to, value: 0 });

        const body = {
          chainId: '5',
          to,
          data,
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

        const to = faker.finance.ethereumAddress();
        const data = await getMockExecTransactionCalldata({ to, value: 0 });

        const body = {
          chainId: '1337', // Invalid chainId
          to,
          data,
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

        const to = faker.finance.ethereumAddress();
        const data = await getMockExecTransactionCalldata({ to, value: 0 });

        const body = {
          chainId: '5',
          to: '0xinvalid', // Not valid
          data,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422, {
            statusCode: 422,
            message: 'Validation failed',
          });
      });

      it('should return a 422 error when the data is not an execTransaction, multiSend or createProxyWithNonce call', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
        );

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
          data: MOCK_UNSUPPORTED_CALLDATA, // Unknown call
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

        const to = faker.finance.ethereumAddress();
        const data = await getMockExecTransactionCalldata({ to, value: 0 });

        const body = {
          chainId: '5',
          to,
          data,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422, {
            statusCode: 422,
            message: 'Safe address is not a valid Safe contract',
          });
      });

      it('should return a 422 error when the data is a multiSend containing no transactions', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          false,
        );

        // 2 x unknown calls
        const data = await getMockMultiSendCalldata([]);

        const body = {
          chainId: '5',
          to: GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS,
          data,
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

        const contract = faker.finance.ethereumAddress();

        // 2 x unknown calls
        const data = await getMockMultiSendCalldata([
          {
            to: contract,
            value: 0,
            data: MOCK_UNSUPPORTED_CALLDATA,
          },
          {
            to: contract,
            value: 0,
            data: MOCK_UNSUPPORTED_CALLDATA,
          },
        ]);

        const body = {
          chainId: '5',
          to: GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS,
          data,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422, {
            statusCode: 422,
            message: 'Validation failed',
          });
      });

      it('should return a 422 error when the data is a multiSend with execTransactions of varying Safes', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          false,
        );

        const execTransaction1 = await getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 0,
        });

        const execTransaction2 = await getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 0,
        });

        // 2 x `execTransaction` calls of different Safes
        const data = await getMockMultiSendCalldata([
          {
            to: faker.finance.ethereumAddress(), // Safe address
            data: execTransaction1,
            value: 0,
          },
          {
            to: faker.finance.ethereumAddress(), // Safe address
            data: execTransaction2,
            value: 0,
          },
        ]);

        const body = {
          chainId: '5',
          to: GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS,
          data,
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

        const execTransaction1 = await getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 0,
        });

        const execTransaction2 = await getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 0,
        });

        const safe = faker.finance.ethereumAddress();

        // 2 x `execTransaction` calls of the same Safe
        const data = await getMockMultiSendCalldata([
          { to: safe, data: execTransaction1, value: 0 },
          { to: safe, data: execTransaction2, value: 0 },
        ]);

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(), // Unofficial deployment
          data,
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

        const execTransaction1 = await getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 0,
        });

        const execTransaction2 = await getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 0,
        });

        const contract = faker.finance.ethereumAddress();

        // 2 x `execTransaction` calls of the same contract
        const data = await getMockMultiSendCalldata([
          { to: contract, data: execTransaction1, value: 0 },
          { to: contract, data: execTransaction2, value: 0 },
        ]);

        const body = {
          chainId: '5',
          to: GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS,
          data,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422, {
            statusCode: 422,
            message: 'Safe address is not a valid Safe contract',
          });
      });

      it('should return a 422 when an unofficial proxy factory deployment is called', async () => {
        (mockSponsorService.sponsoredCall as jest.Mock).mockImplementation(() =>
          Promise.resolve({ taskId: '123' }),
        );

        const data = await getMockCreateProxyWithNonceCalldata({
          owners: [
            faker.finance.ethereumAddress(),
            faker.finance.ethereumAddress(),
          ],
          threshold: 1,
          singleton: GOERLI_L2_SINGLETON_DEPLOYMENT_ADDRESS,
        });

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(), // Unofficial deployment
          data,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(422, {
            statusCode: 422,
            message: 'Validation failed',
          });
      });

      it('should return a 422 when the data is a createProxyWithNonce with an unofficial singleton', async () => {
        (mockSponsorService.sponsoredCall as jest.Mock).mockImplementation(() =>
          Promise.resolve({ taskId: '123' }),
        );

        const data = await getMockCreateProxyWithNonceCalldata({
          owners: [
            faker.finance.ethereumAddress(),
            faker.finance.ethereumAddress(),
          ],
          threshold: 1,
          singleton: faker.finance.ethereumAddress(), // Unofficial singleton
        });

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
          data,
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

        const to = faker.finance.ethereumAddress();
        const data = await getMockExecTransactionCalldata({ to, value: 0 });

        const body = {
          chainId: '5',
          to,
          data,
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

        const to = faker.finance.ethereumAddress();
        const data = await getMockExecTransactionCalldata({ to, value: 0 });

        const body = {
          chainId: '5',
          to,
          data,
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

        const to = faker.finance.ethereumAddress();
        const data = await getMockExecTransactionCalldata({ to, value: 0 });

        const body = {
          chainId: '5',
          to,
          data,
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

      it('should handle non-checksummed addresses', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
        );

        const chainId = '5';
        const to = faker.finance.ethereumAddress();
        const data = await getMockExecTransactionCalldata({ to, value: 0 });

        const body = {
          chainId,
          to: to.toLowerCase(),
          data,
        };

        await request(app.getHttpServer()).post('/v1/relay').send(body);

        await request(app.getHttpServer())
          .get(`/v1/relay/${chainId}/${ethers.getAddress(to)}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toStrictEqual({
              limit: 5,
              remaining: 4,
            });
          });
      });

      it('should increment the relay limit if limit has not been reached', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
        );

        const chainId = '5';
        const to = faker.finance.ethereumAddress();
        const data = await getMockExecTransactionCalldata({ to, value: 0 });

        const body = {
          chainId,
          to,
          data,
        };

        await request(app.getHttpServer()).post('/v1/relay').send(body);

        await request(app.getHttpServer())
          .get(`/v1/relay/${chainId}/${to}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toStrictEqual({
              limit: 5,
              remaining: 4,
            });
          });
      });

      it('should increment all the owners of a createProxyWithNonce call', async () => {
        const chainId = '5';

        const owners = [
          faker.finance.ethereumAddress(),
          faker.finance.ethereumAddress(),
        ];

        const data = await getMockCreateProxyWithNonceCalldata({
          owners,
          threshold: 1,
          singleton: GOERLI_L1_SINGLETON_DEPLOYMENT_ADDRESS,
        });

        const body = {
          chainId,
          to: GOERLI_PROXY_FACTORY_DEPLOYMENT_ADDRESS,
          data,
        };

        await request(app.getHttpServer())
          .post('/v1/relay')
          .send(body)
          .expect(201);

        await Promise.all(
          owners.map((owner) => {
            return request(app.getHttpServer())
              .get(`/v1/relay/${chainId}/${owner}`)
              .expect(200)
              .expect((res) => {
                expect(res.body).toStrictEqual({
                  limit: 5,
                  remaining: 4,
                });
              });
          }),
        );
      });

      it('should not return negative limits more requests were made than the limit', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
        );

        const chainId = '5';
        const to = faker.finance.ethereumAddress();
        const data = await getMockExecTransactionCalldata({ to, value: 0 });

        const body = {
          chainId,
          to,
          data,
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
          .get(`/v1/relay/${chainId}/${to}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toStrictEqual({
              limit: 5,
              remaining: 0,
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

  describe('/v1/relay/health (GET)', () => {
    it('should return a 200 response', async () => {
      await request(app.getHttpServer())
        .get(`/v1/relay/health`)
        .expect(200, {});
    });
  });
});
