import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { PrismaService } from '../prisma.service';
import { AppConfig, CONFIG } from '../config';

export interface OutgoingEmail {
  to: string;
  subject: string;
  body: string;
}

export const MAILER = Symbol('MAILER');
/** Optional override of the SMTP transport (used by tests). */
export const SMTP_TRANSPORT = Symbol('SMTP_TRANSPORT');

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

/**
 * REAL EMAIL ADAPTER — sends through the SMTP service set in SMTP_URL.
 * Works with any transactional email provider that offers SMTP.
 * The recipient address is never written to logs.
 */
@Injectable()
export class SmtpMailer implements Mailer {
  private readonly logger = new Logger('SmtpMailer');
  private readonly transport: Transporter;
  constructor(
    @Inject(CONFIG) private readonly config: AppConfig,
    @Optional() @Inject(SMTP_TRANSPORT) transport?: Transporter,
  ) {
    if (!config.SMTP_URL || !config.EMAIL_FROM) throw new Error('SmtpMailer needs SMTP_URL and EMAIL_FROM.');
    this.transport = transport ?? nodemailer.createTransport(config.SMTP_URL);
  }

  async send(email: OutgoingEmail): Promise<void> {
    await this.transport.sendMail({ from: this.config.EMAIL_FROM, to: email.to, subject: email.subject, text: email.body });
    this.logger.log(`email sent: ${email.subject}`);
  }
}

/** Chooses the real adapter when SMTP is configured, otherwise the sandbox. */
export function mailerFor(config: AppConfig) {
  return config.realEmail ? SmtpMailer : SandboxMailer;
}
