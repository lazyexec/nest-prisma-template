import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { RedisAdapter } from '@/infrastructure/redis/redis.adapter';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisAdapter: RedisAdapter,
  ) {}

  async checkReadiness(): Promise<{
    status: 'ok';
    checks: { database: 'up'; redis: 'up' };
  }> {
    const prismaClient = this.prisma as unknown as {
      $queryRaw: (query: TemplateStringsArray) => Promise<unknown>;
    };
    await prismaClient.$queryRaw`SELECT 1`;
    const redisClient = await this.redisAdapter.getClient();
    await redisClient.ping();

    return {
      status: 'ok',
      checks: {
        database: 'up',
        redis: 'up',
      },
    };
  }

  checkLiveness(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
