import { OnModuleDestroy } from '@nestjs/common';

import { ICacheService } from '../cache.service.interface';

export class MockCacheService implements ICacheService, OnModuleDestroy {
  private cache: Record<string, unknown> = {};
  private _timeoutIds: Array<NodeJS.Timeout> = [];

  public async get(key: string): Promise<string | null> {
    const entry = this.cache[key];
    const value = typeof entry === 'string' ? entry : null;
    return Promise.resolve(value);
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    this.cache[key] = value;

    if (typeof ttl === 'number') {
      const timeoutId = setTimeout(() => {
        delete this.cache[key];
        this._timeoutIds = this._timeoutIds.filter((id) => id !== timeoutId);
      }, ttl);
    }

    Promise.resolve();
  }

  public keyCount(): number {
    return Object.keys(this.cache).length;
  }

  public onModuleDestroy(): void {
    this._timeoutIds.forEach((id) => clearTimeout(id));
  }
}
