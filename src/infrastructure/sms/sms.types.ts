export interface SmsMessage {
  to: string;
  body: string;
}

export interface SmsPort {
  send(message: SmsMessage): Promise<void>;
  isConfigured(): boolean;
}
