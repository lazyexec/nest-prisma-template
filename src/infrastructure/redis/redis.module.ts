import { Global, Module } from '@nestjs/common';
import {
  CACHE_PORT,
  REDIS_CLIENT,
} from '@/infrastructure/redis/redis.constants';
import { RedisService } from '@/infrastructure/redis/redis.service';
import { RedisAdapter } from '@/infrastructure/redis/redis.adapter';

@Global()
@Module({
  providers: [
    RedisAdapter,
    {
      provide: REDIS_CLIENT,
      inject: [RedisAdapter],
      useFactory: async (adapter: RedisAdapter) => adapter.getClient(),
    },
    RedisService,
    {
      provide: CACHE_PORT,
      useExisting: RedisService,
    },
  ],
  exports: [RedisAdapter, RedisService, REDIS_CLIENT, CACHE_PORT],
})
export class RedisModule {}
