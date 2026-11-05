import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RequestCategory, RequestStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { MemberGuard, StaffGuard, StaffRoles } from '../auth/guards';
import { ZodPipe } from '../common/zod.pipe';
import { AuthedRequest } from '../common/request';
import { countryCode } from '../common/schemas';
import { CreateRequest, createRequestSchema, RequestsService, STAFF_ACTIONS, UpdateRequest, updateRequestSchema } from './requests.service';

const { VERIFICATION_SPECIALIST: VS, COMPLIANCE_SPECIALIST: CS, ADMINISTRATOR: AD, SUPER_ADMINISTRATOR: SA } = Role;

const consentSchema = z.object({ consent: z.boolean() });
const actionSchema = z.object({ action: z.enum(STAFF_ACTIONS), reason: z.string().trim().min(3).max(1000).optional() });
const staffListSchema = z.object({ status: z.nativeEnum(RequestStatus).optional() });
const publicListSchema = z.object({ country: countryCode.optional(), category: z.nativeEnum(RequestCategory).optional() });

const actorOf = (req: AuthedRequest) => ({ id: req.auth!.user.id, roles: req.auth!.roles, ip: req.ip });

/** Applicants manage their own requests. */
@Controller('me/requests')
@UseGuards(MemberGuard)
export class MyRequestsController {
  constructor(@Inject(RequestsService) private readonly requests: RequestsService) {}

  @Get()
  async list(@Req() req: AuthedRequest) {
    return { items: await this.requests.listOwn(req.auth!.user.id) };
  }

  @Post()
  async create(@Body(new ZodPipe(createRequestSchema)) body: CreateRequest, @Req() req: AuthedRequest) {
    return { request: await this.requests.create(actorOf(req), body) };
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthedRequest) {
    return { request: await this.requests.getOwn(id, req.auth!.user.id) };
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodPipe(updateRequestSchema)) body: UpdateRequest, @Req() req: AuthedRequest) {
    return { request: await this.requests.update(id, actorOf(req), body) };
  }

  @Post(':id/submit')
  async submit(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthedRequest) {
    return { request: await this.requests.submit(id, actorOf(req), req.auth!.user.emailVerifiedAt !== null) };
  }

  @Post(':id/cancel')
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthedRequest) {
    return { request: await this.requests.cancel(id, actorOf(req)) };
  }

  @Post(':id/consent')
  async consent(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodPipe(consentSchema)) body: z.infer<typeof consentSchema>, @Req() req: AuthedRequest) {
    return { request: await this.requests.setConsent(id, actorOf(req), body.consent) };
  }
}

/** Staff review queue. */
@Controller('admin/requests')
@UseGuards(StaffGuard)
export class AdminRequestsController {
  constructor(@Inject(RequestsService) private readonly requests: RequestsService) {}

  @Get()
  @StaffRoles(VS, CS, AD, SA)
  async list(@Query(new ZodPipe(staffListSchema)) query: z.infer<typeof staffListSchema>) {
    return { items: await this.requests.staffList(query.status) };
  }

  @Get(':id')
  @StaffRoles(VS, CS, AD, SA)
  async get(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthedRequest) {
    return { request: await this.requests.staffGet(id, actorOf(req)) };
  }

  @Post(':id/actions')
  @StaffRoles(VS, CS, AD, SA)
  async act(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodPipe(actionSchema)) body: z.infer<typeof actionSchema>, @Req() req: AuthedRequest) {
    return { request: await this.requests.staffAct(id, actorOf(req), body.action, body.reason) };
  }
}

/** Published requests, readable by anyone. */
@Controller('public/requests')
export class PublicRequestsController {
  constructor(@Inject(RequestsService) private readonly requests: RequestsService) {}

  @Get()
  async list(@Query(new ZodPipe(publicListSchema)) query: z.infer<typeof publicListSchema>) {
    return { items: await this.requests.publicList(query) };
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    return { request: await this.requests.publicGet(id) };
  }
}
