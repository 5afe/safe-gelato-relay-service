import { faker } from '@faker-js/faker';

import { FakeCacheService } from './fake.cache.service';

describe('FakeCacheService', () => {
  let cache: FakeCacheService;

  beforeEach(() => {
    cache = new FakeCacheService();
  });

  it('sets and gets keys', async () => {
    const key = faker.string.alphanumeric();
    const value = faker.string.alphanumeric();

    await cache.set(key, value);
    expect(cache.keyCount()).toBe(1);

    expect(cache.get(key)).resolves.toBe(value);
  });

  it('sets keys with expiration', async () => {
    jest.useFakeTimers();

    const key = faker.string.alphanumeric();
    const value = faker.string.alphanumeric();
    const ttl = faker.datatype.number();

    await cache.set(key, value, ttl);
    expect(cache.keyCount()).toBe(1);

    expect(cache.get(key)).resolves.toBe(value);

    jest.advanceTimersByTime(ttl + 1);

    expect(cache.keyCount()).toBe(0);
    expect(cache.get(key)).resolves.toBe(null);
  });
});
