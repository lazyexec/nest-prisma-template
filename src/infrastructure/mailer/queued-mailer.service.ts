import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  MAIL_JOB_SEND,
  MAIL_QUEUE,
} from '@/infrastructure/queue/queue.constants';
import type { MailJobData } from '@/infrastructure/queue/queue.types';
import type {
  MailerPort,
  MailMessage,
} from '@/infrastructure/mailer/mailer.types';

@Injectable()
export class QueuedMailerService implements MailerPort {
  constructor(
    @InjectQueue(MAIL_QUEUE) private readonly queue: Queue<MailJobData>,
  ) {}

  async send(message: MailMessage): Promise<void> {
    await this.queue.add(MAIL_JOB_SEND, message);
  }
}
