import { Controller, Get } from '@nestjs/common';
import { HealthService } from '@/core/health/health.service';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('liveness')
  liveness() {
    return this.healthService.checkLiveness();
  }

  @Get('readiness')
  readiness() {
    return this.healthService.checkReadiness();
  }
}
