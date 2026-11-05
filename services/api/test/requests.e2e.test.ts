import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { bootApp, createStaff, prisma, registerMember, staffSignIn } from './helpers';

// A fictional test-only country (ZZ is a user-assigned ISO code) with recorded sign-off,
// so publication can be tested without touching real countries.
const TEST_COUNTRY = 'ZZ';

const draft = (over: Record<string, unknown> = {}) => ({
  title: 'Electricity bill for October',
  summary: 'My electricity bill is overdue after a job loss and I need help to avoid disconnection.',
  category: 'ENERGY',
  countryCode: 'FR',
  currency: 'EUR',
  amountRequestedMinor: 24000,
  ...over,
});

describe('Assistance requests', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let reviewerCookie: string;
  let complianceCookie: string;

  async function verifiedApplicant() {
    const m = await registerMember(app, ['APPLICANT']);
    await prisma.user.update({ where: { email: m.email }, data: { emailVerifiedAt: new Date() } });
    return m;
  }

  async function createDraft(cookie: string, over: Record<string, unknown> = {}) {
    const res = await request(server).post('/v1/me/requests').set('Cookie', cookie).send(draft(over)).expect(201);
    return res.body.request.id as string;
  }

  const act = (cookie: string, id: string, action: string, reason?: string) =>
    request(server).post(`/v1/admin/requests/${id}/actions`).set('Cookie', cookie).send({ action, ...(reason ? { reason } : {}) });

  beforeAll(async () => {
    app = await bootApp();
    server = app.getHttpServer();
    const signoff = { legalSignOffBy: 'Test counsel', legalSignOffAt: new Date(), legalSignOffRef: 'TEST-ONLY', paymentSignOffBy: 'Test provider', paymentSignOffAt: new Date(), paymentSignOffRef: 'TEST-ONLY' };
    await prisma.country.upsert({
      where: { code: TEST_COUNTRY },
      create: { code: TEST_COUNTRY, name: 'Testland (automated tests only)', languages: ['en'], currencies: ['EUR'], availability: 'APPROVED_FOR_BETA', ...signoff },
      update: { availability: 'APPROVED_FOR_BETA', ...signoff },
    });
    const reviewer = await createStaff(['VERIFICATION_SPECIALIST']);
    reviewerCookie = await staffSignIn(app, reviewer.email);
    const compliance = await createStaff(['COMPLIANCE_SPECIALIST']);
    complianceCookie = await staffSignIn(app, compliance.email);
  });

  afterAll(async () => {
    // Leave no public requests or approved test country behind for other test suites.
    await prisma.assistanceRequest.updateMany({ where: { countryCode: TEST_COUNTRY }, data: { status: 'CANCELLED', publishedAt: null } });
    await prisma.country.update({ where: { code: TEST_COUNTRY }, data: { availability: 'NOT_RESEARCHED' } });
    await app.close();
  });

  it('only applicants can create requests, and drafts are private', async () => {
    const donor = await registerMember(app, ['DONOR']);
    await request(server).post('/v1/me/requests').set('Cookie', donor.cookie).send(draft()).expect(403);
    const a = await verifiedApplicant();
    const id = await createDraft(a.cookie);
    const own = await request(server).get(`/v1/me/requests/${id}`).set('Cookie', a.cookie).expect(200);
    expect(own.body.request).toMatchObject({ status: 'DRAFT', publicConsent: false, amountFundedMinor: 0 });
    // Another member gets the same answer as for a request that does not exist.
    const other = await verifiedApplicant();
    await request(server).get(`/v1/me/requests/${id}`).set('Cookie', other.cookie).expect(404);
    await request(server).get(`/v1/public/requests/${id}`).expect(404);
  });

  it('validates content: amounts in whole minor units, country currency, healthcare switched off, display name', async () => {
    const a = await verifiedApplicant();
    const post = (over: Record<string, unknown>) => request(server).post('/v1/me/requests').set('Cookie', a.cookie).send(draft(over));
    expect((await post({ amountRequestedMinor: 12.5 })).status).toBe(400);
    expect((await post({ amountRequestedMinor: 50 })).status).toBe(400);
    expect((await post({ amountRequestedMinor: 2_000_000 })).status).toBe(400);
    expect((await post({ currency: 'USD' })).body.error).toBe('currency_not_used_in_country');
    expect((await post({ category: 'HEALTHCARE' })).body.error).toBe('category_unavailable');
    expect((await post({ displayMode: 'DISPLAY_NAME' })).body.error).toBe('display_name_required');
    expect((await post({ deadline: '2000-01-01' })).body.error).toBe('deadline_out_of_range');
    expect((await post({ summary: 'too short' })).status).toBe(400);
  });

  it('limits open requests per applicant', async () => {
    const a = await verifiedApplicant();
    for (let i = 0; i < 3; i++) await createDraft(a.cookie);
    const res = await request(server).post('/v1/me/requests').set('Cookie', a.cookie).send(draft()).expect(400);
    expect(res.body.error).toBe('too_many_open_requests');
  });

  it('requires a confirmed email to submit, and drafts only can be edited', async () => {
    const unverified = await registerMember(app, ['APPLICANT']);
    const id = await createDraft(unverified.cookie);
    expect((await request(server).post(`/v1/me/requests/${id}/submit`).set('Cookie', unverified.cookie)).body.error).toBe('email_not_verified');

    const a = await verifiedApplicant();
    const id2 = await createDraft(a.cookie);
    await request(server).patch(`/v1/me/requests/${id2}`).set('Cookie', a.cookie).send({ title: 'Electricity bill, updated' }).expect(200);
    await request(server).post(`/v1/me/requests/${id2}/submit`).set('Cookie', a.cookie).expect(201);
    const res = await request(server).patch(`/v1/me/requests/${id2}`).set('Cookie', a.cookie).send({ title: 'Changed after submit' }).expect(400);
    expect(res.body.error).toBe('only_drafts_can_be_edited');
  });

  it('full review: changes requested, resubmitted, approved; publication needs consent AND an approved country', async () => {
    const a = await verifiedApplicant();
    const id = await createDraft(a.cookie, { displayMode: 'DISPLAY_NAME', publicDisplayName: 'Lea from Lyon' });
    await request(server).post(`/v1/me/requests/${id}/submit`).set('Cookie', a.cookie).expect(201);

    // Reason is mandatory when sending back.
    await act(reviewerCookie, id, 'start_review').expect(201);
    expect((await act(reviewerCookie, id, 'request_changes')).body.error).toBe('reason_required');
    await act(reviewerCookie, id, 'request_changes', 'Please explain what the amount covers.').expect(201);
    const back = await request(server).get(`/v1/me/requests/${id}`).set('Cookie', a.cookie).expect(200);
    expect(back.body.request).toMatchObject({ status: 'DRAFT', lastDecisionNote: 'Please explain what the amount covers.' });
    expect(back.body.request.history[0]).not.toHaveProperty('actorId');

    await request(server).post(`/v1/me/requests/${id}/submit`).set('Cookie', a.cookie).expect(201);
    await act(reviewerCookie, id, 'start_review').expect(201);
    await act(reviewerCookie, id, 'approve').expect(201);

    // A verification specialist cannot publish.
    expect((await act(reviewerCookie, id, 'publish')).status).toBe(403);
    // No consent yet.
    expect((await act(complianceCookie, id, 'publish')).body.error).toBe('applicant_consent_missing');
    await request(server).post(`/v1/me/requests/${id}/consent`).set('Cookie', a.cookie).send({ consent: true }).expect(201);
    // France has no legal + payment sign-off.
    expect((await act(complianceCookie, id, 'publish')).body.error).toBe('country_not_approved');
    expect(await request(server).get('/v1/public/requests').then((r) => r.body.items.find((i: any) => i.id === id))).toBeUndefined();
  });

  it('publishes in an approved country without exposing the applicant, and withdrawing consent takes it offline', async () => {
    const a = await verifiedApplicant();
    const id = await createDraft(a.cookie, { countryCode: TEST_COUNTRY });
    await request(server).post(`/v1/me/requests/${id}/submit`).set('Cookie', a.cookie).expect(201);
    await act(reviewerCookie, id, 'start_review').expect(201);
    await act(reviewerCookie, id, 'approve').expect(201);
    await request(server).post(`/v1/me/requests/${id}/consent`).set('Cookie', a.cookie).send({ consent: true }).expect(201);
    await act(complianceCookie, id, 'publish').expect(201);

    const list = await request(server).get(`/v1/public/requests?country=${TEST_COUNTRY}&category=ENERGY`).expect(200);
    const item = list.body.items.find((i: any) => i.id === id);
    expect(item).toMatchObject({ status: 'PUBLISHED', displayName: null, amountRequestedMinor: 24000, amountFundedMinor: 0, amountRemainingMinor: 24000, countryName: expect.stringContaining('Testland') });
    const text = JSON.stringify(item);
    expect(text).not.toContain(a.email);
    expect(item).not.toHaveProperty('applicantId');
    await request(server).get(`/v1/public/requests/${id}`).expect(200);

    await request(server).post(`/v1/me/requests/${id}/consent`).set('Cookie', a.cookie).send({ consent: false }).expect(201);
    await request(server).get(`/v1/public/requests/${id}`).expect(404);
    const own = await request(server).get(`/v1/me/requests/${id}`).set('Cookie', a.cookie).expect(200);
    expect(own.body.request).toMatchObject({ status: 'APPROVED', publicConsent: false });
  });

  it('staff cannot act on their own request, and invalid transitions are refused', async () => {
    const staff = await createStaff(['COMPLIANCE_SPECIALIST', 'APPLICANT']);
    const cookie = await staffSignIn(app, staff.email);
    const own = await prisma.assistanceRequest.create({ data: { ...draft(), category: 'ENERGY', applicantId: staff.id, status: 'SUBMITTED' } as any });
    expect((await act(cookie, own.id, 'start_review')).body.error).toBe('cannot_act_on_own_request');

    const a = await verifiedApplicant();
    const id = await createDraft(a.cookie);
    expect((await act(reviewerCookie, id, 'approve')).body.error).toBe('invalid_transition');
  });

  it('records every status change permanently and in the audit log', async () => {
    const a = await verifiedApplicant();
    const id = await createDraft(a.cookie);
    await request(server).post(`/v1/me/requests/${id}/submit`).set('Cookie', a.cookie).expect(201);
    await act(reviewerCookie, id, 'reject', 'Outside the eligible needs.').expect(201);
    const history = await prisma.requestStatusChange.findMany({ where: { requestId: id }, orderBy: { id: 'asc' } });
    expect(history.map((h) => h.toStatus)).toEqual(['DRAFT', 'SUBMITTED', 'REJECTED']);
    await expect(prisma.requestStatusChange.update({ where: { id: history[0].id }, data: { reason: 'tampered' } })).rejects.toThrow(/cannot be edited/);
    const audit = await prisma.auditLog.findMany({ where: { targetId: id }, select: { action: true } });
    expect(audit.map((x) => x.action)).toEqual(expect.arrayContaining(['request.created', 'request.submitted', 'request.reject']));
    // Rejected requests can no longer be cancelled or re-published.
    await request(server).post(`/v1/me/requests/${id}/cancel`).set('Cookie', a.cookie).expect(400);
  });

  it('the database itself refuses public requests without consent and funding above the amount', async () => {
    const a = await verifiedApplicant();
    const id = await createDraft(a.cookie);
    await expect(prisma.assistanceRequest.update({ where: { id }, data: { status: 'PUBLISHED' } })).rejects.toThrow(/request_public_requires_consent/);
    await expect(prisma.assistanceRequest.update({ where: { id }, data: { amountFundedMinor: 999999 } })).rejects.toThrow(/request_amounts_valid/);
  });

  it('members can review the queue only with a staff role, and requests appear in the personal data export', async () => {
    const a = await verifiedApplicant();
    await createDraft(a.cookie);
    await request(server).get('/v1/admin/requests').set('Cookie', a.cookie).expect(401);
    const queue = await request(server).get('/v1/admin/requests?status=SUBMITTED').set('Cookie', reviewerCookie).expect(200);
    expect(Array.isArray(queue.body.items)).toBe(true);
    const exp = await request(server).get('/v1/me/export').set('Cookie', a.cookie).expect(200);
    expect(exp.body.assistanceRequests).toHaveLength(1);
  });
});
