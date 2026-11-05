import { Body, Controller, Get, HttpCode, Inject, Post, Req } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { ZodPipe } from '../common/zod.pipe';
import { email, locale } from '../common/schemas';
import { memberToken } from '../auth/roles';
import { SensitiveRateLimit } from '../common/throttle';
import type { Request } from 'express';

// "website" is a honeypot: hidden from humans, bots tend to fill it in.
const honeypot = z.string().max(0).optional();

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email,
  topic: z.enum(['general', 'applicant', 'donor', 'partnership', 'press', 'privacy', 'accessibility']),
  message: z.string().trim().min(10).max(5000),
  locale: locale.default('en'),
  website: honeypot,
});

const abuseSchema = z.object({
  category: z.enum(['fraud', 'impersonation', 'harassment', 'privacy', 'other']),
  targetUrl: z.string().trim().max(500).optional(),
  description: z.string().trim().min(10).max(5000),
  reporterEmail: email.optional(),
  website: honeypot,
});

@Controller('public')
export class PublicController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  @Post('contact')
  @HttpCode(201)
  @SensitiveRateLimit()
  async contact(@Body(new ZodPipe(contactSchema)) body: z.infer<typeof contactSchema>) {
    const { website: _hp, ...data } = body;
    const msg = await this.prisma.contactMessage.create({ data });
    return { id: msg.id, status: 'received' };
  }

  @Post('abuse-reports')
  @HttpCode(201)
  @SensitiveRateLimit()
  async report(@Body(new ZodPipe(abuseSchema)) body: z.infer<typeof abuseSchema>, @Req() req: Request) {
    const { website: _hp, ...data } = body;
    // Link the report to the reporter's account if they are signed in.
    const session = await this.auth.resolveSession(memberToken(req), 'member');
    const report = await this.prisma.abuseReport.create({
      data: { ...data, reporterId: session?.user.id, reporterEmail: data.reporterEmail ?? session?.user.email },
    });
    await this.audit.record({ actorId: session?.user.id, action: 'abuse_report.created', targetType: 'AbuseReport', targetId: report.id, ipAddress: req.ip, metadata: { category: data.category } });
    return { id: report.id, status: 'received' };
  }

  @Get('countries')
  async countries() {
    const items = await this.prisma.country.findMany({
      orderBy: { name: 'asc' },
      select: { code: true, name: true, availability: true, languages: true, currencies: true },
    });
    return { items };
  }

  /**
   * Transparency figures. Every number must come from real system records.
   * Money and request figures do not exist until Milestones 3–4, so they are
   * reported as unavailable rather than as zero or invented values.
   */
  @Get('stats')
  async stats() {
    const countriesAvailable = await this.prisma.country.count({
      where: { availability: { in: ['APPROVED_FOR_BETA', 'APPROVED_FOR_LAUNCH'] } },
    });
    return {
      generatedAt: new Date().toISOString(),
      realMoneyEnabled: false,
      countriesAvailable,
      contributionsProcessed: null,
      assistancePaid: null,
      completedRequests: null,
      note: 'payments_and_requests_not_built_yet',
    };
  }
}
