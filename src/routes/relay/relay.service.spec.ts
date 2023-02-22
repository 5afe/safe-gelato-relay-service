import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import * as request from 'supertest';

import { SafeInfoHelper } from '../common/safe/safe-info.helper';
import { RelayService, _getRelayGasLimit } from './relay.service';
import configuration from '../../config/configuration';
import { RelayModule } from './relay.module';

describe('getRelayGasLimit', () => {
  it('should return undefined if no gasLimit is provided', () => {
    expect(_getRelayGasLimit()).toBe(undefined);
  });

  it('should return the gasLimit plus the buffer', () => {
    const GAS_LIMIT_BUFFER = 150_000;

    expect(_getRelayGasLimit('100000')).toBe(
      BigInt(100000) + BigInt(GAS_LIMIT_BUFFER),
    );
  });
});

describe('RelayService', () => {
  let app: INestApplication;
  let relayService: RelayService;
  let safeInfoHelper: SafeInfoHelper;

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
    safeInfoHelper = moduleFixture.get<SafeInfoHelper>(SafeInfoHelper);

    app = moduleFixture.createNestApplication();
    app.enableVersioning();

    await app.init();
  });

  describe('sponsoredCall', () => {
    it('should throw if the target is not a Safe address', async () => {
      const relayServiceSpy = jest.spyOn(relayService, 'sponsoredCall');
      const safeInfoHelperSpy = jest
        .spyOn(safeInfoHelper, 'isSafe')
        .mockImplementation(() => Promise.resolve(false));

      const chainId = '5';
      const target = faker.finance.ethereumAddress();

      const body = {
        chainId,
        target,
        data: '0x6a761202', // execTransaction
      };

      const response = await request(app.getHttpServer())
        .post('/v1/relay')
        .send(body)
        .expect(400);

      expect(safeInfoHelperSpy).toHaveBeenCalledTimes(1);
      expect(relayServiceSpy).toHaveBeenCalledTimes(1);

      expect(response.body).toStrictEqual({
        statusCode: 400,
        message: `${target} is not a Safe on chain ${chainId}`,
      });
    });
  });
});
