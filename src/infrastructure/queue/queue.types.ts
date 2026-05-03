import type { MailMessage } from '@/infrastructure/mailer/mailer.types';
import type { SmsMessage } from '@/infrastructure/sms/sms.types';

export type MailJobData = MailMessage;
export type SmsJobData = SmsMessage;
