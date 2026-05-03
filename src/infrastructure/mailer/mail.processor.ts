import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailerService } from '@/infrastructure/mailer/mailer.service';
import { MAIL_QUEUE } from '@/infrastructure/queue/queue.constants';
import type { MailJobData } from '@/infrastructure/queue/queue.types';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailer: MailerService) {
    super();
  }

  async process(job: Job<MailJobData>): Promise<void> {
    try {
      await this.mailer.send(job.data);
    } catch (error) {
      this.logger.error(
        `Mail job ${job.id} failed (attempt ${job.attemptsMade + 1}/${job.opts.attempts ?? 1})`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error; // BullMQ retries based on job options
    }
  }
}
