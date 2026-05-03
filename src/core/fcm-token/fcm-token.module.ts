import { Module } from '@nestjs/common';
import { FcmTokenController } from '@/core/fcm-token/fcm-token.controller';
import { FcmTokenService } from '@/core/fcm-token/fcm-token.service';

@Module({
  controllers: [FcmTokenController],
  providers: [FcmTokenService],
  exports: [FcmTokenService],
})
export class FcmTokenModule {}
