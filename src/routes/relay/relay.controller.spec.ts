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
  getMockAddOwnerWithThresholdCalldata,
  getMockChangeThresholdCalldata,
  getMockCreateProxyWithNonceCalldata,
  getMockDisableModuleCalldata,
  getMockEnableModuleCalldata,
  getMockErc20TransferCalldata,
  getMockExecTransactionCalldata,
  getMockMultiSendCalldata,
  getMockRemoveOwnerCallData,
  getMockSetFallbackHandlerCalldata,
  getMockSetGuardCalldata,
  getMockSwapOwnerCallData,
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
import { TestCacheModule } from '../../datasources/cache/__tests__/test.cache.module';
import { TestAppProvider } from '../../__tests__/test-app.provider';
import { SUPPORTED_SAFE_VERSION } from './constants';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS = getMultiSendCallOnlyDeployment({
  version: SUPPORTED_SAFE_VERSION,
  network: SupportedChainId.GOERLI,
})!.networkAddresses[SupportedChainId.GOERLI];

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const GOERLI_L1_SINGLETON_DEPLOYMENT_ADDRESS = getSafeSingletonDeployment({
  version: SUPPORTED_SAFE_VERSION,
  network: SupportedChainId.GOERLI,
})!.networkAddresses[SupportedChainId.GOERLI];

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const GOERLI_L2_SINGLETON_DEPLOYMENT_ADDRESS = getSafeL2SingletonDeployment({
  version: SUPPORTED_SAFE_VERSION,
  network: SupportedChainId.GOERLI,
})!.networkAddresses[SupportedChainId.GOERLI];

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const GOERLI_PROXY_FACTORY_DEPLOYMENT_ADDRESS = getProxyFactoryDeployment({
  version: SUPPORTED_SAFE_VERSION,
  network: SupportedChainId.GOERLI,
})!.networkAddresses[SupportedChainId.GOERLI];

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
                  [SupportedChainId.GOERLI]: faker.word.sample(),
                  [SupportedChainId.GNOSIS_CHAIN]: faker.word.sample(),
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
      async function testSuccessfulSafeTx(to: string, data: string) {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
        );

        (mockSponsorService.sponsoredCall as jest.Mock).mockImplementation(() =>
          Promise.resolve({ taskId: '123' }),
        );

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
      }

      describe('execTransaction', () => {
        it('should return a 201 when the body is a valid execTransaction call', async () => {
          const data = getMockExecTransactionCalldata({
            // execTransaction to different party of value
            to: faker.finance.ethereumAddress(),
            value: 1,
            data: '0x',
          });

          await testSuccessfulSafeTx(faker.finance.ethereumAddress(), data);
        });

        it('should return a 201 when the body is an ERC-20 tranfer execTransaction call', async () => {
          const data = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            // ERC-20 transfer transactions have a value of 0
            value: 0,
            data: getMockErc20TransferCalldata({
              to: faker.finance.ethereumAddress(),
              value: 1,
            }),
          });

          await testSuccessfulSafeTx(faker.finance.ethereumAddress(), data);
        });

        it('should return a 201 when the body is a cancellation execTransaction call', async () => {
          const safe = faker.finance.ethereumAddress();

          const data = getMockExecTransactionCalldata({
            to: safe,
            // Cancellation transactions have a value of 0 and empty data
            value: 0,
            data: '0x',
          });

          await testSuccessfulSafeTx(safe, data);
        });

        it('should return a 201 when the body is an addOwnerWithThreshold execTransaction call', async () => {
          const safe = faker.finance.ethereumAddress();

          const data = getMockExecTransactionCalldata({
            to: safe,
            // addOwnerWithThreshold transactions have a value of 0
            value: 0,
            data: getMockAddOwnerWithThresholdCalldata(),
          });

          await testSuccessfulSafeTx(safe, data);
        });

        it('should return a 201 when the body is an changeThreshold execTransaction call', async () => {
          const safe = faker.finance.ethereumAddress();

          const data = getMockExecTransactionCalldata({
            to: safe,
            // changeThreshold transactions have a value of 0
            value: 0,
            data: getMockChangeThresholdCalldata(),
          });

          await testSuccessfulSafeTx(safe, data);
        });

        it('should return a 201 when the body is an disableModule execTransaction call', async () => {
          const safe = faker.finance.ethereumAddress();

          const data = getMockExecTransactionCalldata({
            to: safe,
            // disableModule transactions have a value of 0
            value: 0,
            data: getMockDisableModuleCalldata(),
          });

          await testSuccessfulSafeTx(safe, data);
        });

        it('should return a 201 when the body is an enableModule execTransaction call', async () => {
          const safe = faker.finance.ethereumAddress();

          const data = getMockExecTransactionCalldata({
            to: safe,
            // enableModule transactions have a value of 0
            value: 0,
            data: getMockEnableModuleCalldata(),
          });

          await testSuccessfulSafeTx(safe, data);
        });

        it('should return a 201 when the body is an removeOwner execTransaction call', async () => {
          const safe = faker.finance.ethereumAddress();

          const data = getMockExecTransactionCalldata({
            to: safe,
            // removeOwner transactions have a value of 0
            value: 0,
            data: getMockRemoveOwnerCallData(),
          });

          await testSuccessfulSafeTx(safe, data);
        });

        it('should return a 201 when the body is an setFallbackHandler execTransaction call', async () => {
          const safe = faker.finance.ethereumAddress();

          const data = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            // setFallbackHandler transactions have a value of 0
            value: 0,
            data: getMockSetFallbackHandlerCalldata(),
          });

          await testSuccessfulSafeTx(safe, data);
        });

        it('should return a 201 when the body is an setGuard execTransaction call', async () => {
          const safe = faker.finance.ethereumAddress();

          const data = getMockExecTransactionCalldata({
            to: safe,
            // setGuard transactions have a value of 0
            value: 0,
            data: getMockSetGuardCalldata(),
          });

          await testSuccessfulSafeTx(safe, data);
        });

        it('should return a 201 when the body is an swapOwner execTransaction call', async () => {
          const safe = faker.finance.ethereumAddress();

          const data = getMockExecTransactionCalldata({
            to: safe,
            // swapOwner transactions have a value of 0
            value: 0,
            data: getMockSwapOwnerCallData(),
          });

          await testSuccessfulSafeTx(safe, data);
        });
      });

      describe('multiSend', () => {
        it('should return a 201 when the body is a valid multiSend call, containing execTransactions', async () => {
          // execTransactions to different parties of value
          const value1 = 1;
          const execTransaction1 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: 1,
          });

          const value2 = 1;
          const execTransaction2 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: value2,
          });

          const safe = faker.finance.ethereumAddress();

          // 2 x `execTransaction` calls of the same Safe
          const data = getMockMultiSendCalldata([
            { to: safe, data: execTransaction1, value: value1 },
            { to: safe, data: execTransaction2, value: value2 },
          ]);

          await testSuccessfulSafeTx(GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS, data);
        });

        it('should return a 201 when the body is a valid multiSend call, containing an ERC-20 transfer execTransaction call', async () => {
          // execTransactions to different parties of value
          const value1 = 1;
          const execTransaction1 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: 1,
          });

          // ERC-20 transfer transactions have a value of 0
          const value2 = 0;
          const execTransaction2 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: value2,
            data: getMockErc20TransferCalldata({
              to: faker.finance.ethereumAddress(),
              value: 1,
            }),
          });

          const safe = faker.finance.ethereumAddress();

          // 2 x `execTransaction` calls of the same Safe
          const data = getMockMultiSendCalldata([
            { to: safe, data: execTransaction1, value: value1 },
            { to: safe, data: execTransaction2, value: value2 },
          ]);

          await testSuccessfulSafeTx(GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS, data);
        });

        it('should return a 201 when the body is a valid multiSend call, containing a cancellation execTransaction call', async () => {
          // execTransaction to different party of value
          const value1 = 1;
          const execTransaction1 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: 1,
          });

          // Cancellation transactions have a value of 0 and empty data
          const value2 = 0;
          const execTransaction2 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: value2,
            data: '0x',
          });

          const safe = faker.finance.ethereumAddress();

          // 2 x `execTransaction` calls of the same Safe
          const data = getMockMultiSendCalldata([
            { to: safe, data: execTransaction1, value: value1 },
            { to: safe, data: execTransaction2, value: value2 },
          ]);

          await testSuccessfulSafeTx(GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS, data);
        });

        it('should return a 201 when the body is a valid multiSend call, containing an addOwnerWithThreshold execTransaction call', async () => {
          const value1 = 1;
          const execTransaction1 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: 1,
          });

          // addOwnerWithThreshold transactions have a value of 0
          const value2 = 0;
          const execTransaction2 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: value2,
            data: getMockAddOwnerWithThresholdCalldata(),
          });

          const safe = faker.finance.ethereumAddress();

          // 2 x `execTransaction` calls of the same Safe
          const data = getMockMultiSendCalldata([
            { to: safe, data: execTransaction1, value: value1 },
            { to: safe, data: execTransaction2, value: value2 },
          ]);

          await testSuccessfulSafeTx(GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS, data);
        });

        it('should return a 201 when the body is a valid multiSend call, containing a changeThreshold execTransaction call', async () => {
          const value1 = 1;
          const execTransaction1 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: 1,
          });

          // changeThreshold transactions have a value of 0
          const value2 = 0;
          const execTransaction2 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: value2,
            data: getMockChangeThresholdCalldata(),
          });

          const safe = faker.finance.ethereumAddress();

          // 2 x `execTransaction` calls of the same Safe
          const data = getMockMultiSendCalldata([
            { to: safe, data: execTransaction1, value: value1 },
            { to: safe, data: execTransaction2, value: value2 },
          ]);

          await testSuccessfulSafeTx(GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS, data);
        });

        it('should return a 201 when the body is a valid multiSend call, containing a disableModule execTransaction call', async () => {
          const value1 = 1;
          const execTransaction1 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: 1,
          });

          // disableModule transactions have a value of 0
          const value2 = 0;
          const execTransaction2 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: value2,
            data: getMockDisableModuleCalldata(),
          });

          const safe = faker.finance.ethereumAddress();

          // 2 x `execTransaction` calls of the same Safe
          const data = getMockMultiSendCalldata([
            { to: safe, data: execTransaction1, value: value1 },
            { to: safe, data: execTransaction2, value: value2 },
          ]);

          await testSuccessfulSafeTx(GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS, data);
        });

        it('should return a 201 when the body is a valid multiSend call, containing a enableModule execTransaction call', async () => {
          const value1 = 1;
          const execTransaction1 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: 1,
          });

          // enableModule transactions have a value of 0
          const value2 = 0;
          const execTransaction2 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: value2,
            data: getMockEnableModuleCalldata(),
          });

          const safe = faker.finance.ethereumAddress();

          // 2 x `execTransaction` calls of the same Safe
          const data = getMockMultiSendCalldata([
            { to: safe, data: execTransaction1, value: value1 },
            { to: safe, data: execTransaction2, value: value2 },
          ]);

          await testSuccessfulSafeTx(GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS, data);
        });

        it('should return a 201 when the body is a valid multiSend call, containing a removeOwner execTransaction call', async () => {
          const value1 = 1;
          const execTransaction1 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: 1,
          });

          // removeOwner transactions have a value of 0
          const value2 = 0;
          const execTransaction2 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: value2,
            data: getMockRemoveOwnerCallData(),
          });

          const safe = faker.finance.ethereumAddress();

          // 2 x `execTransaction` calls of the same Safe
          const data = getMockMultiSendCalldata([
            { to: safe, data: execTransaction1, value: value1 },
            { to: safe, data: execTransaction2, value: value2 },
          ]);

          await testSuccessfulSafeTx(GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS, data);
        });

        it('should return a 201 when the body is a valid multiSend call, containing a setFallbackHandler execTransaction call', async () => {
          const value1 = 1;
          const execTransaction1 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: 1,
          });

          // setFallbackHandler transactions have a value of 0
          const value2 = 0;
          const execTransaction2 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: value2,
            data: getMockSetFallbackHandlerCalldata(),
          });

          const safe = faker.finance.ethereumAddress();

          // 2 x `execTransaction` calls of the same Safe
          const data = getMockMultiSendCalldata([
            { to: safe, data: execTransaction1, value: value1 },
            { to: safe, data: execTransaction2, value: value2 },
          ]);

          await testSuccessfulSafeTx(GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS, data);
        });

        it('should return a 201 when the body is a valid multiSend call, containing a setGuard execTransaction call', async () => {
          const value1 = 1;
          const execTransaction1 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: 1,
          });

          // setGuard transactions have a value of 0
          const value2 = 0;
          const execTransaction2 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: value2,
            data: getMockSetGuardCalldata(),
          });

          const safe = faker.finance.ethereumAddress();

          // 2 x `execTransaction` calls of the same Safe
          const data = getMockMultiSendCalldata([
            { to: safe, data: execTransaction1, value: value1 },
            { to: safe, data: execTransaction2, value: value2 },
          ]);

          await testSuccessfulSafeTx(GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS, data);
        });

        it('should return a 201 when the body is a valid multiSend call, containing a swapOwner execTransaction call', async () => {
          const value1 = 1;
          const execTransaction1 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: 1,
          });

          // swapOwner transactions have a value of 0
          const value2 = 0;
          const execTransaction2 = getMockExecTransactionCalldata({
            to: faker.finance.ethereumAddress(),
            value: value2,
            data: getMockSwapOwnerCallData(),
          });

          const safe = faker.finance.ethereumAddress();

          // 2 x `execTransaction` calls of the same Safe
          const data = getMockMultiSendCalldata([
            { to: safe, data: execTransaction1, value: value1 },
            { to: safe, data: execTransaction2, value: value2 },
          ]);

          await testSuccessfulSafeTx(GOERLI_MULTI_SEND_CALL_ONLY_ADDRESS, data);
        });
      });

      describe('createProxyWithNonce', () => {
        // We do not use test201Transaction in these tests as isSafeContract should
        // not be mocked as it is never called in the createProxyWithNonce flow

        it('should return a 201 when the body is a valid L1 createProxyWithNonce call', async () => {
          (mockSponsorService.sponsoredCall as jest.Mock).mockImplementation(
            () => Promise.resolve({ taskId: '123' }),
          );

          const data = getMockCreateProxyWithNonceCalldata({
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
          (mockSponsorService.sponsoredCall as jest.Mock).mockImplementation(
            () => Promise.resolve({ taskId: '123' }),
          );

          const data = getMockCreateProxyWithNonceCalldata({
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
      });

      it('should return a 500 if the relayer throws', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
        );

        (mockSponsorService.sponsoredCall as jest.Mock).mockImplementation(() =>
          Promise.reject(),
        );

        const data = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 1,
        });

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
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

        const data = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 1,
        });

        const body = {
          chainId: '1337', // Invalid chainId
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

      it('should return a 422 error when the to address is invalid', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          false,
        );

        const data = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 1,
        });

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

      it('should return a 422 error when the data is an execTransaction to self', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
        );

        const to = faker.finance.ethereumAddress();
        const data = getMockExecTransactionCalldata({ to, value: 1 });

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
            message: 'Validation failed',
          });
      });

      it('should return a 422 error when the data is an ERC-20 transfer execTransaction to self', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
        );

        const safe = faker.finance.ethereumAddress();
        const data = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          // ERC-20 transfer transactions have a value of 0
          value: 0,
          data: getMockErc20TransferCalldata({
            to: safe,
            value: 1,
          }),
        });

        const body = {
          chainId: '5',
          to: safe,
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

      it('should return a 422 error when the data is an execTransaction to a non-Safe', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          false, // Not a Safe
        );

        const data = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 1,
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
            message: 'Safe address is not a valid Safe contract',
          });
      });

      it('should return a 422 error when the data is a multiSend containing no transactions', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          false,
        );

        const data = getMockMultiSendCalldata([]);

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
        const data = getMockMultiSendCalldata([
          {
            to: contract,
            value: 1,
            data: MOCK_UNSUPPORTED_CALLDATA,
          },
          {
            to: contract,
            value: 1,
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

      it('should return a 422 error when the data is a multiSend with execTransaction(s) to self', async () => {
        (mockSafeInfoService.isSafeContract as jest.Mock).mockResolvedValue(
          true,
        );

        const selfSafe = faker.finance.ethereumAddress(); // Safe address

        const value1 = 1;
        const execTransaction1 = getMockExecTransactionCalldata({
          to: selfSafe,
          value: value1,
        });

        const value2 = 1;
        const execTransaction2 = getMockExecTransactionCalldata({
          to: selfSafe,
          value: value2,
        });

        // 2 x `execTransaction` calls of same Safes
        const data = getMockMultiSendCalldata([
          {
            to: selfSafe,
            data: execTransaction1,
            value: value1,
          },
          {
            to: selfSafe,
            data: execTransaction2,
            value: value2,
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

        const value1 = 1;
        const execTransaction1 = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: value1,
        });

        const value2 = 1;
        const execTransaction2 = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: value2,
        });

        // 2 x `execTransaction` calls of different Safes
        const data = getMockMultiSendCalldata([
          {
            to: faker.finance.ethereumAddress(),
            data: execTransaction1,
            value: value1,
          },
          {
            to: faker.finance.ethereumAddress(),
            data: execTransaction2,
            value: value2,
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
          true,
        );

        const value1 = 1;
        const execTransaction1 = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: value1,
        });

        const value2 = 1;
        const execTransaction2 = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: value2,
        });

        const safe = faker.finance.ethereumAddress();

        // 2 x `execTransaction` calls of the same Safe
        const data = getMockMultiSendCalldata([
          { to: safe, data: execTransaction1, value: value1 },
          { to: safe, data: execTransaction2, value: value2 },
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

        const value1 = 1;
        const execTransaction1 = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: value1,
        });

        const value2 = 1;
        const execTransaction2 = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: value2,
        });

        const contract = faker.finance.ethereumAddress();

        // 2 x `execTransaction` calls of the same contract
        const data = getMockMultiSendCalldata([
          { to: contract, data: execTransaction1, value: value1 },
          { to: contract, data: execTransaction2, value: value2 },
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

        const data = getMockCreateProxyWithNonceCalldata({
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

        const data = getMockCreateProxyWithNonceCalldata({
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

        const data = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 1,
        });

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
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

        const data = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 1,
        });

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
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

        const data = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 1,
        });

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
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

        const data = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 1,
        });

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress().toLowerCase(),
          data,
        };

        await request(app.getHttpServer()).post('/v1/relay').send(body);

        await request(app.getHttpServer())
          .get(`/v1/relay/${body.chainId}/${ethers.getAddress(body.to)}`)
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

        const data = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 1,
        });

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
          data,
        };

        await request(app.getHttpServer()).post('/v1/relay').send(body);

        await request(app.getHttpServer())
          .get(`/v1/relay/${body.chainId}/${body.to}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toStrictEqual({
              limit: 5,
              remaining: 4,
            });
          });
      });

      it('should increment all the owners of a createProxyWithNonce call', async () => {
        const owners = [
          faker.finance.ethereumAddress(),
          faker.finance.ethereumAddress(),
        ];

        const data = getMockCreateProxyWithNonceCalldata({
          owners,
          threshold: 1,
          singleton: GOERLI_L1_SINGLETON_DEPLOYMENT_ADDRESS,
        });

        const body = {
          chainId: '5',
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
              .get(`/v1/relay/${body.chainId}/${owner}`)
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

        const data = getMockExecTransactionCalldata({
          to: faker.finance.ethereumAddress(),
          value: 1,
        });

        const body = {
          chainId: '5',
          to: faker.finance.ethereumAddress(),
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
          .get(`/v1/relay/${body.chainId}/${body.to}`)
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
