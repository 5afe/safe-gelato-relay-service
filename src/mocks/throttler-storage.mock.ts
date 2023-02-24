import { ThrottlerStorage } from '@nestjs/throttler';

export class MockThrottlerStorage implements ThrottlerStorage {
  public storage: Record<string, any> = {};

  increment(key: string, ttl: number): Promise<any> {
    this.storage[key] ??= {
      expiresAt: 0,
      totalHits: 0,
    };

    // ttl is in seconds, expiresAt is in milliseconds
    this.storage[key].expiresAt = Date.now() + ttl * 1000;
    this.storage[key].totalHits += 1;

    return Promise.resolve(this.storage[key]);
  }
}
