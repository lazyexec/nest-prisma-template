import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TwilioSmsService } from '@/infrastructure/sms/twilio-sms.service';
import { SMS_QUEUE } from '@/infrastructure/queue/queue.constants';
import type { SmsJobData } from '@/infrastructure/queue/queue.types';

@Processor(SMS_QUEUE)
export class SmsProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(private readonly sms: TwilioSmsService) {
    super();
  }

  async process(job: Job<SmsJobData>): Promise<void> {
    try {
      await this.sms.send(job.data);
    } catch (error) {
      this.logger.error(
        `SMS job ${job.id} failed (attempt ${job.attemptsMade + 1}/${job.opts.attempts ?? 1})`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
