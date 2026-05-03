import { Global, Module } from '@nestjs/common';
import { MAILER_PORT } from '@/infrastructure/mailer/mailer.constants';
import { MailerService } from '@/infrastructure/mailer/mailer.service';
import { MailProcessor } from '@/infrastructure/mailer/mail.processor';
import { QueuedMailerService } from '@/infrastructure/mailer/queued-mailer.service';

@Global()
@Module({
  providers: [
    MailerService,
    MailProcessor,
    QueuedMailerService,
    { provide: MAILER_PORT, useExisting: QueuedMailerService },
  ],
  exports: [MAILER_PORT],
})
export class MailerModule {}
