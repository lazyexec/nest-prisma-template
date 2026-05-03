import { Global, Module } from '@nestjs/common';
import { SMS_PORT } from '@/infrastructure/sms/sms.constants';
import { TwilioSmsService } from '@/infrastructure/sms/twilio-sms.service';
import { SmsProcessor } from '@/infrastructure/sms/sms.processor';
import { QueuedSmsService } from '@/infrastructure/sms/queued-sms.service';

@Global()
@Module({
  providers: [
    TwilioSmsService,
    SmsProcessor,
    QueuedSmsService,
    { provide: SMS_PORT, useExisting: QueuedSmsService },
  ],
  exports: [SMS_PORT],
})
export class SmsModule {}
