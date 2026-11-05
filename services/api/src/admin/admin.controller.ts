import { BadRequestException, Body, Controller, ForbiddenException, Get, Inject, NotFoundException, Param, ParseUUIDPipe, Patch, Put, Query, Req, UseGuards } from '@nestjs/common';
import { CountryAvailability, DataRequestStatus, ReportStatus, Role, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { StaffGuard, StaffRoles } from '../auth/guards';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { ZodPipe } from '../common/zod.pipe';
import { AuthedRequest } from '../common/request';

const { VERIFICATION_SPECIALIST: VS, COMPLIANCE_SPECIALIST: CS, ADMINISTRATOR: AD, SUPER_ADMINISTRATOR: SA } = Role;

const rolesSchema = z.object({ roles: z.array(z.nativeEnum(Role)).max(6) });
const statusSchema = z.object({ status: z.nativeEnum(UserStatus), reason: z.string().trim().min(3).max(500) });
const reportStatusSchema = z.object({ status: z.nativeEnum(ReportStatus) });
const dataRequestUpdateSchema = z.object({ status: z.nativeEnum(DataRequestStatus), resolution: z.string().trim().max(2000).optional() });
const countrySchema = z.object({
  availability: z.nativeEnum(CountryAvailability).optional(),
  complianceOwner: z.string().trim().max(120).nullable().optional(),
  legalSignOffBy: z.string().trim().max(120).nullable().optional(),
  legalSignOffRef: z.string().trim().max(300).nullable().optional(),
  paymentSignOffBy: z.string().trim().max(120).nullable().optional(),
  paymentSignOffRef: z.string().trim().max(300).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  nextReviewAt: z.coerce.date().nullable().optional(),
});
const pageSchema = z.object({ q: z.string().trim().max(100).optional(), take: z.coerce.number().int().min(1).max(200).default(50) });

@Controller('admin')
@UseGuards(StaffGuard)
export class AdminController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  // ---- Users ------------------------------------------------------------

  @Get('users')
  @StaffRoles(AD, SA, CS)
  async users(@Query(new ZodPipe(pageSchema)) query: z.infer<typeof pageSchema>) {
    const items = await this.prisma.user.findMany({
      where: query.q ? { OR: [{ email: { contains: query.q.toLowerCase() } }, { displayName: { contains: query.q, mode: 'insensitive' } }] } : undefined,
      orderBy: { createdAt: 'desc' },
      take: query.take,
      // Deliberately minimal: no password hashes, no MFA secrets.
      select: { id: true, email: true, displayName: true, status: true, countryCode: true, createdAt: true, emailVerifiedAt: true, mfaEnabledAt: true, roles: { select: { role: true } } },
    });
    return { items: items.map((u) => ({ ...u, roles: u.roles.map((r) => r.role) })) };
  }

  /** Only a super administrator can change roles, and never their own. */
  @Put('users/:id/roles')
  @StaffRoles(SA)
  async setRoles(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodPipe(rolesSchema)) body: z.infer<typeof rolesSchema>, @Req() req: AuthedRequest) {
    const actor = req.auth!.user;
    if (actor.id === id) throw new ForbiddenException({ error: 'cannot_change_own_roles' });
    const target = await this.prisma.user.findUnique({ where: { id }, include: { roles: true } });
    if (!target) throw new NotFoundException();
    const before = target.roles.map((r) => r.role);
    const after = Array.from(new Set(body.roles));
    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.createMany({ data: after.map((role) => ({ userId: id, role, grantedBy: actor.id })) });
      // Role changes take effect immediately: end the target's staff sessions.
      await tx.session.updateMany({ where: { userId: id, isStaff: true, revokedAt: null }, data: { revokedAt: new Date() } });
      await this.audit.record({ actorId: actor.id, action: 'admin.user.roles_changed', targetType: 'User', targetId: id, ipAddress: req.ip, metadata: { before, after } }, tx);
    });
    return { id, roles: after };
  }

  @Patch('users/:id/status')
  @StaffRoles(AD, SA)
  async setStatus(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodPipe(statusSchema)) body: z.infer<typeof statusSchema>, @Req() req: AuthedRequest) {
    const actor = req.auth!.user;
    if (actor.id === id) throw new ForbiddenException({ error: 'cannot_change_own_status' });
    const target = await this.prisma.user.findUnique({ where: { id }, include: { roles: true } });
    if (!target) throw new NotFoundException();
    if (target.roles.some((r) => r.role === SA) && !req.auth!.roles.includes(SA)) throw new ForbiddenException({ error: 'insufficient_role' });
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { status: body.status } });
      if (body.status !== UserStatus.ACTIVE) {
        await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      }
      await this.audit.record({ actorId: actor.id, action: 'admin.user.status_changed', targetType: 'User', targetId: id, ipAddress: req.ip, metadata: { from: target.status, to: body.status, reason: body.reason } }, tx);
    });
    return { id, status: body.status };
  }

  // ---- Audit log ----------------------------------------------------------

  @Get('audit-log')
  @StaffRoles(CS, AD, SA)
  async auditLog(@Query(new ZodPipe(pageSchema)) query: z.infer<typeof pageSchema>) {
    const items = await this.prisma.auditLog.findMany({
      where: query.q ? { action: { contains: query.q } } : undefined,
      orderBy: { id: 'desc' },
      take: query.take,
    });
    return { items: items.map((i) => ({ ...i, id: i.id.toString() })) };
  }

  // ---- Messages and reports -----------------------------------------------

  @Get('contact-messages')
  @StaffRoles(AD, SA, CS)
  async contactMessages() {
    return { items: await this.prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }) };
  }

  @Patch('contact-messages/:id')
  @StaffRoles(AD, SA, CS)
  async updateContact(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodPipe(reportStatusSchema)) body: z.infer<typeof reportStatusSchema>, @Req() req: AuthedRequest) {
    const item = await this.prisma.contactMessage.update({ where: { id }, data: { status: body.status } }).catch(() => null);
    if (!item) throw new NotFoundException();
    await this.audit.record({ actorId: req.auth!.user.id, action: 'admin.contact_message.status_changed', targetType: 'ContactMessage', targetId: id, ipAddress: req.ip, metadata: { status: body.status } });
    return { item };
  }

  @Get('abuse-reports')
  @StaffRoles(VS, CS, AD, SA)
  async abuseReports() {
    return { items: await this.prisma.abuseReport.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }) };
  }

  @Patch('abuse-reports/:id')
  @StaffRoles(VS, CS, AD, SA)
  async updateAbuse(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodPipe(reportStatusSchema)) body: z.infer<typeof reportStatusSchema>, @Req() req: AuthedRequest) {
    const item = await this.prisma.abuseReport.update({ where: { id }, data: { status: body.status } }).catch(() => null);
    if (!item) throw new NotFoundException();
    await this.audit.record({ actorId: req.auth!.user.id, action: 'admin.abuse_report.status_changed', targetType: 'AbuseReport', targetId: id, ipAddress: req.ip, metadata: { status: body.status } });
    return { item };
  }

  // ---- Data protection requests -----------------------------------------

  @Get('data-requests')
  @StaffRoles(CS, AD, SA)
  async dataRequests() {
    const items = await this.prisma.dataRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { user: { select: { email: true, displayName: true } }, handledBy: { select: { email: true } } },
    });
    return { items };
  }

  @Patch('data-requests/:id')
  @StaffRoles(CS, AD, SA)
  async updateDataRequest(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodPipe(dataRequestUpdateSchema)) body: z.infer<typeof dataRequestUpdateSchema>, @Req() req: AuthedRequest) {
    const existing = await this.prisma.dataRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    const item = await this.prisma.dataRequest.update({ where: { id }, data: { status: body.status, resolution: body.resolution, handledById: req.auth!.user.id } });
    await this.audit.record({ actorId: req.auth!.user.id, action: 'admin.data_request.updated', targetType: 'DataRequest', targetId: id, ipAddress: req.ip, metadata: { from: existing.status, to: body.status } });
    return { item };
  }

  // ---- Countries ----------------------------------------------------------

  @Get('countries')
  @StaffRoles(CS, AD, SA)
  async countries() {
    return { items: await this.prisma.country.findMany({ orderBy: { name: 'asc' } }) };
  }

  /**
   * Country availability. Approval for beta/launch requires recorded legal and
   * payment sign-off (also enforced by a database constraint).
   */
  @Patch('countries/:code')
  @StaffRoles(CS, SA)
  async updateCountry(@Param('code') code: string, @Body(new ZodPipe(countrySchema)) body: z.infer<typeof countrySchema>, @Req() req: AuthedRequest) {
    const existing = await this.prisma.country.findUnique({ where: { code: code.toUpperCase() } });
    if (!existing) throw new NotFoundException();
    const now = new Date();
    const data = {
      ...body,
      ...(body.legalSignOffBy !== undefined ? { legalSignOffAt: body.legalSignOffBy ? now : null } : {}),
      ...(body.paymentSignOffBy !== undefined ? { paymentSignOffAt: body.paymentSignOffBy ? now : null } : {}),
      lastReviewedAt: now,
    };
    const merged = { ...existing, ...data };
    const approving = merged.availability === 'APPROVED_FOR_BETA' || merged.availability === 'APPROVED_FOR_LAUNCH';
    if (approving && !(merged.legalSignOffBy && merged.legalSignOffRef && merged.paymentSignOffBy && merged.paymentSignOffRef)) {
      throw new BadRequestException({ error: 'signoff_required', message: 'Legal and payment sign-off (name and document reference) are required before approval.' });
    }
    const item = await this.prisma.country.update({ where: { code: existing.code }, data });
    await this.audit.record({
      actorId: req.auth!.user.id,
      action: 'admin.country.updated',
      targetType: 'Country',
      targetId: existing.code,
      ipAddress: req.ip,
      metadata: { fields: Object.keys(body), from: existing.availability, to: item.availability },
    });
    return { item };
  }
}
