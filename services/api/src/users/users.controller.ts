import { BadRequestException, Body, Controller, Get, HttpCode, Inject, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { DataRequestType, Role } from '@prisma/client';
import { z } from 'zod';
import { MemberGuard } from '../auth/guards';
import { AuthService } from '../auth/auth.service';
import { clientInfo } from '../auth/auth.controller';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { ZodPipe } from '../common/zod.pipe';
import { AuthedRequest } from '../common/request';
import { countryCode, displayName, locale, password } from '../common/schemas';
import { presentSelf } from './present';

const profileSchema = z
  .object({ displayName: displayName.optional(), locale: locale.optional(), countryCode: countryCode.nullable().optional() })
  .refine((v) => Object.keys(v).length > 0, 'empty_update');
const addRoleSchema = z.object({ role: z.enum([Role.APPLICANT, Role.DONOR]) });
const passwordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: password });
const dataRequestSchema = z.object({
  type: z.enum([DataRequestType.ACCESS, DataRequestType.CORRECTION, DataRequestType.DELETION]),
  details: z.string().trim().max(2000).optional(),
});

@Controller('me')
@UseGuards(MemberGuard)
export class UsersController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  @Patch()
  async updateProfile(@Body(new ZodPipe(profileSchema)) body: z.infer<typeof profileSchema>, @Req() req: AuthedRequest) {
    const me = req.auth!.user;
    const user = await this.prisma.user.update({ where: { id: me.id }, data: body, include: { roles: true } });
    await this.audit.record({ actorId: me.id, action: 'user.profile_updated', targetType: 'User', targetId: me.id, ipAddress: req.ip, metadata: { fields: Object.keys(body) } });
    return { user: presentSelf(user) };
  }

  @Post('roles')
  async addRole(@Body(new ZodPipe(addRoleSchema)) body: z.infer<typeof addRoleSchema>, @Req() req: AuthedRequest) {
    const me = req.auth!.user;
    await this.prisma.userRole.upsert({
      where: { userId_role: { userId: me.id, role: body.role } },
      create: { userId: me.id, role: body.role, grantedBy: me.id },
      update: {},
    });
    await this.audit.record({ actorId: me.id, action: 'user.self_role_added', targetType: 'User', targetId: me.id, ipAddress: req.ip, metadata: { role: body.role } });
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: me.id }, include: { roles: true } });
    return { user: presentSelf(user) };
  }

  @Post('password')
  @HttpCode(204)
  async changePassword(@Body(new ZodPipe(passwordSchema)) body: z.infer<typeof passwordSchema>, @Req() req: AuthedRequest) {
    await this.auth.changePassword(req.auth!.user, req.auth!.session.id, body.currentPassword, body.newPassword, clientInfo(req));
  }

  /** Immediate copy of the personal data HumanLift holds about the signed-in user (data access right). */
  @Get('export')
  async exportData(@Req() req: AuthedRequest) {
    const me = req.auth!.user;
    const [sessions, dataRequests, auditEntries] = await Promise.all([
      this.prisma.session.findMany({ where: { userId: me.id }, select: { createdAt: true, expiresAt: true, revokedAt: true, ipAddress: true, userAgent: true } }),
      this.prisma.dataRequest.findMany({ where: { userId: me.id }, select: { type: true, status: true, details: true, resolution: true, createdAt: true } }),
      this.prisma.auditLog.findMany({ where: { actorId: me.id }, select: { occurredAt: true, action: true, ipAddress: true }, orderBy: { occurredAt: 'asc' } }),
    ]);
    await this.audit.record({ actorId: me.id, action: 'user.data_exported', targetType: 'User', targetId: me.id, ipAddress: req.ip });
    return { generatedAt: new Date().toISOString(), profile: presentSelf(me), sessions, dataRequests, activity: auditEntries };
  }

  @Get('data-requests')
  async listDataRequests(@Req() req: AuthedRequest) {
    const items = await this.prisma.dataRequest.findMany({
      where: { userId: req.auth!.user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, type: true, status: true, details: true, resolution: true, createdAt: true },
    });
    return { items };
  }

  @Post('data-requests')
  async createDataRequest(@Body(new ZodPipe(dataRequestSchema)) body: z.infer<typeof dataRequestSchema>, @Req() req: AuthedRequest) {
    const me = req.auth!.user;
    const open = await this.prisma.dataRequest.count({ where: { userId: me.id, type: body.type, status: { in: ['RECEIVED', 'IN_PROGRESS'] } } });
    if (open > 0) throw new BadRequestException({ error: 'request_already_open' });
    const item = await this.prisma.dataRequest.create({
      data: { userId: me.id, type: body.type, details: body.details },
      select: { id: true, type: true, status: true, details: true, resolution: true, createdAt: true },
    });
    await this.audit.record({ actorId: me.id, action: 'user.data_request_created', targetType: 'DataRequest', targetId: item.id, ipAddress: req.ip, metadata: { type: body.type } });
    return { item };
  }
}
