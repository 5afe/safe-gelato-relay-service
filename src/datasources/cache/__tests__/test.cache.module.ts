import { Global, Module } from '@nestjs/common';

import { CacheService } from '../cache.service.interface';
import { MockCacheService } from './mock.cache.service';

const mockCacheService = new MockCacheService();

@Global()
@Module({
  providers: [{ provide: CacheService, useValue: mockCacheService }],
  exports: [CacheService],
})
export class TestCacheModule {}
