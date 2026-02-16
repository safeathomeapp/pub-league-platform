export type SendMessageInput = {
  channel: 'sms' | 'whatsapp' | 'email';
  to: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export interface MessagingProvider {
  send(input: SendMessageInput): Promise<{ providerMessageId: string }>;
}

export class LocalMessagingProvider implements MessagingProvider {
  async send(_input: SendMessageInput): Promise<{ providerMessageId: string }> {
    return { providerMessageId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}` };
  }
}
