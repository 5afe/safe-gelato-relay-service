import { faker } from '@faker-js/faker';
import { ConfigService } from '@nestjs/config';

import { RelayLimitService } from './relay-limit.service';

describe('RelayLimitService', () => {
  const THROTTLE_LIMIT = 5;

  const mockConfigService = new ConfigService({
    gelato: {
      apiKey: {
        '5': 'fakeApiKey',
      },
    },
    relay: {
      ttl: 60 * 60,
      limit: THROTTLE_LIMIT,
    },
  });

  let relayLimitService: RelayLimitService;

  beforeEach(() => {
    relayLimitService = new RelayLimitService(mockConfigService);
  });

  afterEach(() => {
    relayLimitService.onApplicationShutdown();
  });

  describe('incrementRelays', () => {
    it('should increment the current relay attempts', async () => {
      const chainId = '5';
      const address = faker.finance.ethereumAddress();

      const result = await relayLimitService.incrementRelays(chainId, address);

      expect(result).toStrictEqual({
        totalHits: 1,
        timeToExpire: expect.any(Number),
      });
    });
  });

  describe('getRelayLimit', () => {
    it('should return the default remaining number of relays', () => {
      const result = relayLimitService.getRelayLimit(
        '5',
        faker.finance.ethereumAddress(),
      );

      expect(result).toStrictEqual({
        remaining: THROTTLE_LIMIT,
        expiresAt: undefined,
      });
    });

    it('should return the current remaining number of relays', async () => {
      const chainId = '5';
      const address = faker.finance.ethereumAddress();

      await relayLimitService.incrementRelays(chainId, address);

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
        Array.from({ length: THROTTLE_LIMIT + 1 }, () => {
          relayLimitService.incrementRelays(chainId, address);
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
        Array.from({ length: THROTTLE_LIMIT }, () => {
          relayLimitService.incrementRelays(chainId, address);
        }),
      );

      const result = relayLimitService.canRelay(chainId, address);
      expect(result).toBe(false);
    });
  });
});
