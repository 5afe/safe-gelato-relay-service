import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

import { CacheService } from './cache.service.interface';
import { RedisCacheService } from './redis.cache.service';
import {
  LoggingService,
  ILoggingService,
} from '../../routes/common/logging/logging.interface';

async function redisClientFactory(
  configService: ConfigService,
  loggingService: ILoggingService,
) {
  const host = configService.getOrThrow<string>('redis.host');
  const port = configService.getOrThrow<string>('redis.port');

  const client = createClient({
    url: `redis://${host}:${port}`,
  });

  client.on('error', (err) => {
    loggingService.error(`Redis client error: ${err}`);
  });
  client.connect();

  return client;
}

export type RedisClient = Awaited<ReturnType<typeof redisClientFactory>>;

@Global()
@Module({
  providers: [
    {
      provide: 'RedisClient',
      useFactory: redisClientFactory,
      inject: [ConfigService, LoggingService],
    },
    { provide: CacheService, useClass: RedisCacheService },
  ],
  exports: [CacheService],
})
export class CacheModule {}
