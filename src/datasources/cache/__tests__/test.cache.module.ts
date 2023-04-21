import { Global, Module } from '@nestjs/common';

import { CacheService } from '../cache.service.interface';
import { FakeCacheService } from './fake.cache.service';

const fakeCacheService = new FakeCacheService();

@Global()
@Module({
  providers: [{ provide: CacheService, useValue: fakeCacheService }],
  exports: [CacheService],
})
export class TestCacheModule {}
