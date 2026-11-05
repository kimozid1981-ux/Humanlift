import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AppConfig, CONFIG } from '../config';

export interface OutgoingEmail {
  to: string;
  subject: string;
  body: string;
}

export const MAILER = Symbol('MAILER');

export interface Mailer {
  send(email: OutgoingEmail): Promise<void>;
}

/**
 * SANDBOX ADAPTER — does not send real email.
 * Messages are stored in the DevOutboxEmail table and can be read at /v1/dev/outbox
 * in development and test only. A real provider (e.g. a transactional email
 * service) will implement the same Mailer interface.
 */
@Injectable()
export class SandboxMailer implements Mailer {
  private readonly logger = new Logger('SandboxMailer');
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CONFIG) private readonly config: AppConfig,
  ) {}

  async send(email: OutgoingEmail): Promise<void> {
    if (!this.config.devOutboxEnabled) {
      // Fail loudly rather than silently dropping mail in staging/production.
      throw new Error('No real email provider configured. SandboxMailer cannot be used in this environment.');
    }
    await this.prisma.devOutboxEmail.create({ data: email });
    this.logger.log(`[sandbox] email stored for ${email.to}: ${email.subject}`);
  }
}
