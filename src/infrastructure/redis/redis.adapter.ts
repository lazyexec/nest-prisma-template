import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Config } from '@/configs/environment.config';

@Injectable()
export class RedisAdapter implements OnModuleDestroy {
  private readonly logger = new Logger(RedisAdapter.name);
  private client: Redis | undefined;
  private connectingPromise: Promise<Redis> | null = null;

  constructor(private readonly config: ConfigService<Config>) {}

  async getClient(): Promise<Redis> {
    if (this.client !== undefined) {
      return this.client;
    }
    if (this.connectingPromise) {
      return this.connectingPromise;
    }

    const redis = this.config.get<Config['redis']>('redis');
    if (!redis?.url) {
      throw new Error('Redis URL is required');
    }

    this.connectingPromise = (async () => {
      const client = new Redis(redis.url, {
        keyPrefix: redis.keyPrefix,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
      });

      try {
        await client.connect();
        await client.ping();
        this.logger.log('Redis connected');
        this.client = client;
        return client;
      } catch (error) {
        this.logger.error('Redis unavailable during startup');
        await client.quit();
        throw error;
      } finally {
        this.connectingPromise = null;
      }
    })();

    return this.connectingPromise;
  }

  getTtl(): number {
    const redis = this.config.get<Config['redis']>('redis');
    return redis?.ttlSeconds ?? 300;
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) {
      return;
    }

    await this.client.quit();
    this.client = undefined;
  }
}
