import { Module } from '@nestjs/common';
import { HealthController } from '@/core/health/health.controller';
import { HealthService } from '@/core/health/health.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
