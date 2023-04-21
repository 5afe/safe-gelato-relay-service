import { faker } from '@faker-js/faker';

import { RedisCacheService } from './redis.cache.service';
import type { RedisClient } from './cache.module';

const redisClient = {
  get: jest.fn(),
  set: jest.fn(),
  quit: jest.fn(),
} as unknown as RedisClient;

const redisClientMock = jest.mocked(redisClient);

describe('RedisCacheService', () => {
  let redisCacheService: RedisCacheService;

  beforeEach(() => {
    jest.clearAllMocks();

    redisCacheService = new RedisCacheService(redisClientMock);
  });

  it('sets keys', async () => {
    const address = faker.finance.ethereumAddress();
    const value = faker.random.alphaNumeric();

    await redisCacheService.set(address, value);

    expect(redisClientMock.set).toBeCalledTimes(1);
    expect(redisClientMock.set).toBeCalledWith(address, value, {
      EX: undefined,
    });
  });

  it('sets keys with expiration', async () => {
    const address = faker.finance.ethereumAddress();
    const value = faker.random.alphaNumeric();
    const ttl = faker.datatype.number();

    await redisCacheService.set(address, value, ttl);

    expect(redisClientMock.set).toBeCalledTimes(1);
    expect(redisClientMock.set).toBeCalledWith(address, value, { EX: ttl });
  });

  it('gets keys via get', async () => {
    const key = faker.random.alphaNumeric();

    await redisCacheService.get(key);

    expect(redisClientMock.get).toBeCalledTimes(1);
    expect(redisClientMock.get).toBeCalledWith(key);
  });

  it('closes the Redis connection when the module is destroyed', async () => {
    await redisCacheService.onModuleDestroy();

    expect(redisClientMock.quit).toBeCalledTimes(1);
  });
});
