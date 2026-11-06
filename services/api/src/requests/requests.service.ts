import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AssistanceRequest, CountryAvailability, Prisma, RequestCategory, RequestDisplayMode, RequestStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { countryCode } from '../common/schemas';

const S = RequestStatus;
const { VERIFICATION_SPECIALIST: VS, COMPLIANCE_SPECIALIST: CS, ADMINISTRATOR: AD, SUPER_ADMINISTRATOR: SA } = Role;

/** Categories open for new requests. Healthcare stays off until a data protection impact assessment is done. */
export const DISABLED_CATEGORIES: RequestCategory[] = [RequestCategory.HEALTHCARE];

/** Statuses in which a request is visible to the public. */
export const PUBLIC_STATUSES: RequestStatus[] = [S.PUBLISHED, S.PARTIALLY_FUNDED, S.FULLY_FUNDED];
/** Statuses that end a request's life. */
export const FINAL_STATUSES: RequestStatus[] = [S.CLOSED, S.REJECTED, S.CANCELLED, S.PAID_TO_CREDITOR];
/** Countries where publication is allowed (requires recorded legal + payment sign-off, enforced by the database). */
export const PUBLISHING_COUNTRIES: CountryAvailability[] = [CountryAvailability.APPROVED_FOR_BETA, CountryAvailability.APPROVED_FOR_LAUNCH];

/** Most open requests one applicant can have at once (abuse limit). */
export const MAX_OPEN_REQUESTS = 3;
/** Amount limits in minor units: 1.00 to 10,000.00. */
export const MIN_AMOUNT_MINOR = 100;
export const MAX_AMOUNT_MINOR = 1_000_000;

const fields = {
  title: z.string().trim().min(5).max(120),
  summary: z.string().trim().min(30).max(2000),
  category: z.nativeEnum(RequestCategory),
  countryCode,
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
  amountRequestedMinor: z.number().int().min(MIN_AMOUNT_MINOR).max(MAX_AMOUNT_MINOR),
  deadline: z.coerce.date().nullable().optional(),
  displayMode: z.nativeEnum(RequestDisplayMode).default(RequestDisplayMode.ANONYMOUS),
  publicDisplayName: z.string().trim().min(2).max(60).nullable().optional(),
};
export const createRequestSchema = z.object(fields);
export const updateRequestSchema = z
  .object({ ...fields, displayMode: z.nativeEnum(RequestDisplayMode) })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'empty_update');
export type CreateRequest = z.infer<typeof createRequestSchema>;
export type UpdateRequest = z.infer<typeof updateRequestSchema>;

export const STAFF_ACTIONS = ['start_review', 'request_changes', 'approve', 'reject', 'publish', 'suspend', 'reinstate'] as const;
export type StaffAction = (typeof STAFF_ACTIONS)[number];

interface Transition {
  from: RequestStatus[];
  to: RequestStatus;
  roles: Role[];
  reasonRequired: boolean;
}

/** The only status changes staff can make. Funding statuses are reserved for the payment milestone. */
export const STAFF_TRANSITIONS: Record<StaffAction, Transition> = {
  start_review: { from: [S.SUBMITTED], to: S.UNDER_REVIEW, roles: [VS, CS, AD, SA], reasonRequired: false },
  request_changes: { from: [S.UNDER_REVIEW], to: S.DRAFT, roles: [VS, CS, AD, SA], reasonRequired: true },
  approve: { from: [S.UNDER_REVIEW], to: S.APPROVED, roles: [VS, CS, AD, SA], reasonRequired: false },
  reject: { from: [S.SUBMITTED, S.UNDER_REVIEW], to: S.REJECTED, roles: [VS, CS, AD, SA], reasonRequired: true },
  publish: { from: [S.APPROVED], to: S.PUBLISHED, roles: [CS, AD, SA], reasonRequired: false },
  suspend: { from: [S.APPROVED, S.PUBLISHED], to: S.SUSPENDED, roles: [CS, AD, SA], reasonRequired: true },
  reinstate: { from: [S.SUSPENDED], to: S.APPROVED, roles: [CS, AD, SA], reasonRequired: true },
};

/** What the public may see. Never the applicant's id, email, real name (unless chosen) or documents. */
export function presentPublic(r: AssistanceRequest & { country: { name: string } }) {
  return {
    id: r.id,
    title: r.title,
    summary: r.summary,
    category: r.category,
    countryCode: r.countryCode,
    countryName: r.country.name,
    currency: r.currency,
    amountRequestedMinor: r.amountRequestedMinor,
    amountFundedMinor: r.amountFundedMinor,
    amountRemainingMinor: r.amountRequestedMinor - r.amountFundedMinor,
    deadline: r.deadline,
    publishedAt: r.publishedAt,
    displayName: r.displayMode === RequestDisplayMode.DISPLAY_NAME ? r.publicDisplayName : null,
    status: r.status,
  };
}

/** What the applicant sees about their own request. */
export function presentOwn(r: AssistanceRequest) {
  return {
    id: r.id,
    title: r.title,
    summary: r.summary,
    category: r.category,
    countryCode: r.countryCode,
    currency: r.currency,
    amountRequestedMinor: r.amountRequestedMinor,
    amountFundedMinor: r.amountFundedMinor,
    deadline: r.deadline,
    displayMode: r.displayMode,
    publicDisplayName: r.publicDisplayName,
    publicConsent: r.publicConsentAt !== null,
    status: r.status,
    lastDecisionNote: r.lastDecisionNote,
    submittedAt: r.submittedAt,
    publishedAt: r.publishedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

interface Actor {
  id: string;
  roles: Role[];
  ip?: string;
}

@Injectable()
export class RequestsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  private async checkCountryAndCurrency(code: string, currency: string) {
    const country = await this.prisma.country.findUnique({ where: { code } });
    if (!country) throw new BadRequestException({ error: 'unknown_country' });
    if (!country.currencies.includes(currency)) throw new BadRequestException({ error: 'currency_not_used_in_country', allowed: country.currencies });
  }

  private checkContent(v: { category?: RequestCategory; displayMode?: RequestDisplayMode; publicDisplayName?: string | null; deadline?: Date | null }) {
    if (v.category && DISABLED_CATEGORIES.includes(v.category)) throw new BadRequestException({ error: 'category_unavailable' });
    if (v.displayMode === RequestDisplayMode.DISPLAY_NAME && !v.publicDisplayName) throw new BadRequestException({ error: 'display_name_required' });
    if (v.deadline) {
      const now = Date.now();
      if (v.deadline.getTime() <= now || v.deadline.getTime() > now + 366 * 24 * 3600_000) throw new BadRequestException({ error: 'deadline_out_of_range' });
    }
  }

  private async ownOrThrow(id: string, applicantId: string) {
    const r = await this.prisma.assistanceRequest.findUnique({ where: { id } });
    // Same answer whether it does not exist or belongs to someone else.
    if (!r || r.applicantId !== applicantId) throw new NotFoundException({ error: 'not_found' });
    return r;
  }

  /** Changes status, records history and the audit log in one transaction. */
  private async move(
    r: AssistanceRequest,
    to: RequestStatus,
    actor: Actor,
    action: string,
    reason: string | undefined,
    extra: Prisma.AssistanceRequestUpdateInput = {},
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Guard against two people acting at once: only update if the status is still what we checked.
      const updated = await tx.assistanceRequest.updateMany({ where: { id: r.id, status: r.status }, data: { ...(extra as Prisma.AssistanceRequestUpdateManyMutationInput), status: to } });
      if (updated.count !== 1) throw new ConflictException({ error: 'status_changed_meanwhile' });
      await tx.requestStatusChange.create({ data: { requestId: r.id, fromStatus: r.status, toStatus: to, actorId: actor.id, reason } });
      await this.audit.record({ actorId: actor.id, action, targetType: 'AssistanceRequest', targetId: r.id, ipAddress: actor.ip, metadata: { from: r.status, to } }, tx);
      return tx.assistanceRequest.findUniqueOrThrow({ where: { id: r.id } });
    });
  }

  // ---- Applicant ------------------------------------------------------------

  async create(actor: Actor, body: CreateRequest) {
    if (!actor.roles.includes(Role.APPLICANT)) throw new ForbiddenException({ error: 'applicant_role_required' });
    this.checkContent(body);
    await this.checkCountryAndCurrency(body.countryCode, body.currency);
    const open = await this.prisma.assistanceRequest.count({ where: { applicantId: actor.id, status: { notIn: FINAL_STATUSES } } });
    if (open >= MAX_OPEN_REQUESTS) throw new BadRequestException({ error: 'too_many_open_requests', limit: MAX_OPEN_REQUESTS });
    const r = await this.prisma.$transaction(async (tx) => {
      const created = await tx.assistanceRequest.create({
        data: {
          applicantId: actor.id,
          title: body.title,
          summary: body.summary,
          category: body.category,
          countryCode: body.countryCode,
          currency: body.currency,
          amountRequestedMinor: body.amountRequestedMinor,
          deadline: body.deadline ?? null,
          displayMode: body.displayMode,
          publicDisplayName: body.displayMode === RequestDisplayMode.DISPLAY_NAME ? body.publicDisplayName : null,
        },
      });
      await tx.requestStatusChange.create({ data: { requestId: created.id, fromStatus: null, toStatus: S.DRAFT, actorId: actor.id } });
      await this.audit.record({ actorId: actor.id, action: 'request.created', targetType: 'AssistanceRequest', targetId: created.id, ipAddress: actor.ip }, tx);
      return created;
    });
    return presentOwn(r);
  }

  async listOwn(applicantId: string) {
    const items = await this.prisma.assistanceRequest.findMany({ where: { applicantId }, orderBy: { createdAt: 'desc' } });
    return items.map(presentOwn);
  }

  async getOwn(id: string, applicantId: string) {
    const r = await this.ownOrThrow(id, applicantId);
    const history = await this.prisma.requestStatusChange.findMany({
      where: { requestId: id },
      orderBy: { id: 'asc' },
      // Staff identities are not shown to applicants.
      select: { fromStatus: true, toStatus: true, reason: true, occurredAt: true },
    });
    return { ...presentOwn(r), history };
  }

  async update(id: string, actor: Actor, body: UpdateRequest) {
    const r = await this.ownOrThrow(id, actor.id);
    if (r.status !== S.DRAFT) throw new BadRequestException({ error: 'only_drafts_can_be_edited' });
    const merged = { ...r, ...body };
    this.checkContent({ ...body, displayMode: merged.displayMode, publicDisplayName: merged.publicDisplayName });
    if (body.countryCode || body.currency) await this.checkCountryAndCurrency(merged.countryCode, merged.currency);
    const data: Prisma.AssistanceRequestUpdateInput = { ...body };
    if (merged.displayMode === RequestDisplayMode.ANONYMOUS) data.publicDisplayName = null;
    const updated = await this.prisma.assistanceRequest.update({ where: { id }, data });
    await this.audit.record({ actorId: actor.id, action: 'request.edited', targetType: 'AssistanceRequest', targetId: id, ipAddress: actor.ip, metadata: { fields: Object.keys(body) } });
    return presentOwn(updated);
  }

  async submit(id: string, actor: Actor, emailVerified: boolean) {
    if (!emailVerified) throw new ForbiddenException({ error: 'email_not_verified' });
    const r = await this.ownOrThrow(id, actor.id);
    if (r.status !== S.DRAFT) throw new BadRequestException({ error: 'invalid_transition' });
    return presentOwn(await this.move(r, S.SUBMITTED, actor, 'request.submitted', undefined, { submittedAt: new Date(), lastDecisionNote: null }));
  }

  async cancel(id: string, actor: Actor) {
    const r = await this.ownOrThrow(id, actor.id);
    // Funding statuses cannot be cancelled this way once payments exist.
    const cancellable: RequestStatus[] = [S.DRAFT, S.SUBMITTED, S.UNDER_REVIEW, S.APPROVED, S.PUBLISHED, S.SUSPENDED];
    if (!cancellable.includes(r.status)) throw new BadRequestException({ error: 'invalid_transition' });
    return presentOwn(await this.move(r, S.CANCELLED, actor, 'request.cancelled_by_applicant', undefined));
  }

  /** Explicit applicant consent to public visibility. Withdrawing it takes a published request offline. */
  async setConsent(id: string, actor: Actor, consent: boolean) {
    const r = await this.ownOrThrow(id, actor.id);
    if (FINAL_STATUSES.includes(r.status)) throw new BadRequestException({ error: 'request_closed' });
    if (consent) {
      const updated = await this.prisma.assistanceRequest.update({ where: { id }, data: { publicConsentAt: r.publicConsentAt ?? new Date() } });
      await this.audit.record({ actorId: actor.id, action: 'request.public_consent_given', targetType: 'AssistanceRequest', targetId: id, ipAddress: actor.ip });
      return presentOwn(updated);
    }
    if (r.status === S.PUBLISHED) {
      const moved = await this.move(r, S.APPROVED, actor, 'request.unpublished_consent_withdrawn', 'Applicant withdrew consent to public visibility.', { publicConsentAt: null, publishedAt: null });
      return presentOwn(moved);
    }
    if (PUBLIC_STATUSES.includes(r.status)) throw new BadRequestException({ error: 'cannot_withdraw_while_funding' });
    const updated = await this.prisma.assistanceRequest.update({ where: { id }, data: { publicConsentAt: null } });
    await this.audit.record({ actorId: actor.id, action: 'request.public_consent_withdrawn', targetType: 'AssistanceRequest', targetId: id, ipAddress: actor.ip });
    return presentOwn(updated);
  }

  // ---- Staff ----------------------------------------------------------------

  async staffList(status?: RequestStatus) {
    const items = await this.prisma.assistanceRequest.findMany({
      where: status ? { status } : { status: { not: S.DRAFT } },
      orderBy: [{ submittedAt: 'asc' }, { createdAt: 'asc' }],
      take: 200,
      include: { country: { select: { name: true, availability: true } } },
    });
    return items.map((r) => ({ ...presentOwn(r), countryName: r.country.name, countryAvailability: r.country.availability }));
  }

  async staffGet(id: string, actor: Actor) {
    const r = await this.prisma.assistanceRequest.findUnique({
      where: { id },
      include: {
        country: { select: { name: true, availability: true } },
        applicant: { select: { id: true, email: true, displayName: true, emailVerifiedAt: true, status: true } },
        history: { orderBy: { id: 'asc' } },
      },
    });
    if (!r) throw new NotFoundException({ error: 'not_found' });
    await this.audit.record({ actorId: actor.id, action: 'request.viewed_by_staff', targetType: 'AssistanceRequest', targetId: id, ipAddress: actor.ip });
    return {
      ...presentOwn(r),
      countryName: r.country.name,
      countryAvailability: r.country.availability,
      applicant: r.applicant,
      history: r.history.map((h) => ({ fromStatus: h.fromStatus, toStatus: h.toStatus, actorId: h.actorId, reason: h.reason, occurredAt: h.occurredAt })),
      allowedActions: STAFF_ACTIONS.filter((a) => STAFF_TRANSITIONS[a].from.includes(r.status) && STAFF_TRANSITIONS[a].roles.some((role) => actor.roles.includes(role))),
    };
  }

  async staffAct(id: string, actor: Actor, action: StaffAction, reason?: string) {
    const t = STAFF_TRANSITIONS[action];
    if (!t.roles.some((role) => actor.roles.includes(role))) throw new ForbiddenException({ error: 'insufficient_role' });
    if (t.reasonRequired && !reason) throw new BadRequestException({ error: 'reason_required' });
    const r = await this.prisma.assistanceRequest.findUnique({ where: { id }, include: { country: true } });
    if (!r) throw new NotFoundException({ error: 'not_found' });
    // Separation of duties: nobody reviews or publishes their own request.
    if (r.applicantId === actor.id) throw new ForbiddenException({ error: 'cannot_act_on_own_request' });
    if (!t.from.includes(r.status)) throw new BadRequestException({ error: 'invalid_transition', status: r.status });
    const extra: Prisma.AssistanceRequestUpdateInput = {};
    if (action === 'publish') {
      if (!r.publicConsentAt) throw new BadRequestException({ error: 'applicant_consent_missing', message: 'The applicant has not agreed to make this request public.' });
      if (!PUBLISHING_COUNTRIES.includes(r.country.availability)) {
        throw new BadRequestException({ error: 'country_not_approved', message: 'Requests can only be published in countries approved for beta or launch (legal and payment sign-off recorded).' });
      }
      extra.publishedAt = new Date();
    }
    if (action === 'suspend' || action === 'request_changes' || action === 'reject' || action === 'reinstate') extra.lastDecisionNote = reason;
    if (action === 'suspend') extra.publishedAt = null;
    const moved = await this.move(r, t.to, actor, `request.${action}`, reason, extra);
    return presentOwn(moved);
  }

  // ---- Public ---------------------------------------------------------------

  private publicWhere(extra: Prisma.AssistanceRequestWhereInput = {}): Prisma.AssistanceRequestWhereInput {
    // A request disappears again if its country loses approval.
    return { status: { in: PUBLIC_STATUSES }, publicConsentAt: { not: null }, country: { availability: { in: PUBLISHING_COUNTRIES } }, ...extra };
  }

  async publicList(filter: { country?: string; category?: RequestCategory }) {
    const items = await this.prisma.assistanceRequest.findMany({
      where: this.publicWhere({ ...(filter.country ? { countryCode: filter.country } : {}), ...(filter.category ? { category: filter.category } : {}) }),
      orderBy: { publishedAt: 'desc' },
      take: 100,
      include: { country: { select: { name: true } } },
    });
    return items.map(presentPublic);
  }

  async publicGet(id: string) {
    const r = await this.prisma.assistanceRequest.findFirst({ where: this.publicWhere({ id }), include: { country: { select: { name: true } } } });
    if (!r) throw new NotFoundException({ error: 'not_found' });
    return presentPublic(r);
  }
}
