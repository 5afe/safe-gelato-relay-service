import { Global, Module } from '@nestjs/common';

import { CacheService } from '../cache.service.interface';
import { FakeCacheService } from './fake.cache.service';

const mockCacheService = new FakeCacheService();

@Global()
@Module({
  providers: [{ provide: CacheService, useValue: mockCacheService }],
  exports: [CacheService],
})
export class TestCacheModule {}
