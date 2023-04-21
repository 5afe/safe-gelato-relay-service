import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';

import { ICacheService } from './cache.service.interface';
import { RedisClient } from './cache.module';

@Injectable()
export class RedisCacheService implements ICacheService, OnModuleDestroy {
  constructor(@Inject('RedisClient') private readonly client: RedisClient) {}

  public async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.client.set(key, value, { EX: ttl });
  }

  public async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
