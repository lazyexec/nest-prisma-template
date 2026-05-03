import { Controller, Get } from '@nestjs/common';
import { CacheKey, CacheTtl } from '@/common/core/decorators/cache.decorator';
import { HealthService } from '@/core/health/health.service';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('liveness')
  @CacheKey('health:liveness')
  @CacheTtl(10)
  liveness() {
    return this.healthService.checkLiveness();
  }

  @Get('readiness')
  @CacheKey('health:readiness')
  @CacheTtl(15)
  readiness() {
    return this.healthService.checkReadiness();
  }
}
