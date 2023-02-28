import { faker } from '@faker-js/faker';
import { ConfigService } from '@nestjs/config';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { RelayLimitService } from './relay-limit.service';

describe('RelayLimitService', () => {
  const THROTTLE_LIMIT = 5;

  let relayLimitService: RelayLimitService;
  beforeEach(() => {
    const mockConfigService = new ConfigService({
      gelato: {
        apiKey: {
          '5': 'fakeApiKey',
        },
      },
      throttle: {
        ttl: 60 * 60,
        limit: THROTTLE_LIMIT,
      },
    });

    const throttlerStorageService = new ThrottlerStorageService();

    relayLimitService = new RelayLimitService(
      throttlerStorageService,
      mockConfigService,
    );
  });

  describe('increment', () => {
    it('should increment the current Safe', async () => {
      const chainId = '5';
      const address = faker.finance.ethereumAddress();

      const result = await relayLimitService.increment(chainId, address);

      expect(result).toStrictEqual({
        totalHits: 1,
        timeToExpire: expect.any(Number),
      });
    });
  });

  describe('getRelayLimit', () => {
    it('should return the default remaining number of relays', () => {
      const address = faker.finance.ethereumAddress();
      const result = relayLimitService.getRelayLimit('5', address);

      expect(result).toStrictEqual({
        remaining: THROTTLE_LIMIT,
        expiresAt: undefined,
      });
    });

    it('should return the current remaining number of relays', async () => {
      const chainId = '5';
      const address = faker.finance.ethereumAddress();

      await relayLimitService.increment(chainId, address);

      const result = relayLimitService.getRelayLimit(chainId, address);

      expect(result).toStrictEqual({
        remaining: THROTTLE_LIMIT - 1,
        expiresAt: expect.any(Number),
      });
    });

    it('should return not return negative remaining amounts of relays', async () => {
      const chainId = '5';
      const address = faker.finance.ethereumAddress();

      await Promise.all(
        Array.from({ length: THROTTLE_LIMIT + 1 }, async () => {
          relayLimitService.increment(chainId, address);
        }),
      );

      const result = relayLimitService.getRelayLimit(chainId, address);

      expect(result).toStrictEqual({
        remaining: 0,
        expiresAt: expect.any(Number),
      });
    });
  });

  describe('canRelay', () => {
    it('returns true if relaying is possible', () => {
      const result = relayLimitService.canRelay(
        '5',
        faker.finance.ethereumAddress(),
      );
      expect(result).toBe(true);
    });

    it('returns false if relaying is not possible', async () => {
      const chainId = '5';
      const address = faker.finance.ethereumAddress();

      await Promise.all(
        Array.from({ length: THROTTLE_LIMIT }, async () => {
          await relayLimitService.increment(chainId, address);
        }),
      );

      const result = relayLimitService.canRelay(chainId, address);
      expect(result).toBe(false);
    });
  });
});
