import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authenticator } from 'otplib';
import { bootApp, cookieFrom, createStaff, prisma, registerMember, staffSignIn, STRONG_PASSWORD } from './helpers';

describe('Admin dashboard API', () => {
  let app: INestApplication;
  let server: any;
  beforeAll(async () => {
    app = await bootApp();
    server = app.getHttpServer();
  });
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('refuses staff sign-in for a member account, with the same answer as a wrong password', async () => {
    const { email } = await registerMember(app);
    const notStaff = await request(server).post('/v1/admin/auth/login').send({ email, password: STRONG_PASSWORD }).expect(401);
    const wrong = await request(server).post('/v1/admin/auth/login').send({ email, password: 'wrong password!!' }).expect(401);
    expect(notStaff.body).toEqual(wrong.body);
  });

  it('requires MFA before any admin endpoint, then allows access', async () => {
    const { email } = await createStaff(['ADMINISTRATOR']);
    const login = await request(server).post('/v1/admin/auth/login').send({ email, password: STRONG_PASSWORD }).expect(200);
    expect(login.body.next).toBe('mfa_enrol');
    const cookie = cookieFrom(login, 'hl_admin_session');
    const blocked = await request(server).get('/v1/admin/users').set('Cookie', cookie).expect(401);
    expect(blocked.body.error).toBe('mfa_required');

    const enrol = await request(server).post('/v1/admin/auth/mfa/enrol').set('Cookie', cookie).expect(201);
    expect(enrol.body.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    await request(server).post('/v1/admin/auth/mfa/verify').set('Cookie', cookie).send({ code: '000000' }).expect(401);
    await request(server).post('/v1/admin/auth/mfa/verify').set('Cookie', cookie).send({ code: authenticator.generate(enrol.body.manualEntryKey) }).expect(204);
    await request(server).get('/v1/admin/users').set('Cookie', cookie).expect(200);

    // The MFA secret is stored encrypted, not in plain text.
    const stored = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(stored.mfaSecretEnc).toMatch(/^v1\./);
    expect(stored.mfaSecretEnc).not.toContain(enrol.body.manualEntryKey);

    // Next sign-in asks to verify (not re-enrol), and enrolling again is refused.
    const again = await request(server).post('/v1/admin/auth/login').send({ email, password: STRONG_PASSWORD }).expect(200);
    expect(again.body.next).toBe('mfa_verify');
    await request(server).post('/v1/admin/auth/mfa/enrol').set('Cookie', cookieFrom(again, 'hl_admin_session')).expect(400);
  });

  it('never returns password hashes or MFA secrets in the user list', async () => {
    const { email } = await createStaff(['ADMINISTRATOR']);
    const cookie = await staffSignIn(app, email);
    const res = await request(server).get('/v1/admin/users').set('Cookie', cookie).expect(200);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|mfaSecret|argon2/);
  });

  it('enforces least privilege between staff roles', async () => {
    const vs = await createStaff(['VERIFICATION_SPECIALIST']);
    const vsCookie = await staffSignIn(app, vs.email);
    await request(server).get('/v1/admin/abuse-reports').set('Cookie', vsCookie).expect(200);
    await request(server).get('/v1/admin/users').set('Cookie', vsCookie).expect(403);
    await request(server).get('/v1/admin/audit-log').set('Cookie', vsCookie).expect(403);
    await request(server).patch('/v1/admin/countries/FR').set('Cookie', vsCookie).send({ notes: 'x' }).expect(403);

    const admin = await createStaff(['ADMINISTRATOR']);
    const adminCookie = await staffSignIn(app, admin.email);
    const member = await registerMember(app);
    await request(server).put(`/v1/admin/users/${member.user.id}/roles`).set('Cookie', adminCookie).send({ roles: ['ADMINISTRATOR'] }).expect(403);
  });

  it('lets a super administrator change roles (audited) but not their own', async () => {
    const sa = await createStaff(['SUPER_ADMINISTRATOR']);
    const cookie = await staffSignIn(app, sa.email);
    const member = await registerMember(app);
    await request(server).put(`/v1/admin/users/${sa.id}/roles`).set('Cookie', cookie).send({ roles: [] }).expect(403);
    const res = await request(server).put(`/v1/admin/users/${member.user.id}/roles`).set('Cookie', cookie).send({ roles: ['DONOR', 'VERIFICATION_SPECIALIST'] }).expect(200);
    expect(res.body.roles.sort()).toEqual(['DONOR', 'VERIFICATION_SPECIALIST']);
    const entry = await prisma.auditLog.findFirst({ where: { action: 'admin.user.roles_changed', targetId: member.user.id } });
    expect(entry?.actorId).toBe(sa.id);
    expect(entry?.metadata).toMatchObject({ before: ['DONOR'], after: ['DONOR', 'VERIFICATION_SPECIALIST'] });
  });

  it('suspending a user ends their sessions', async () => {
    const admin = await createStaff(['ADMINISTRATOR']);
    const cookie = await staffSignIn(app, admin.email);
    const member = await registerMember(app);
    await request(server).get('/v1/auth/me').set('Cookie', member.cookie).expect(200);
    await request(server).patch(`/v1/admin/users/${member.user.id}/status`).set('Cookie', cookie).send({ status: 'SUSPENDED', reason: 'test suspension' }).expect(200);
    await request(server).get('/v1/auth/me').set('Cookie', member.cookie).expect(401);
    await request(server).post('/v1/auth/login').send({ email: member.email, password: STRONG_PASSWORD }).expect(403);
  });

  it('refuses to approve a country without legal and payment sign-off', async () => {
    const cs = await createStaff(['COMPLIANCE_SPECIALIST']);
    const cookie = await staffSignIn(app, cs.email);
    const refused = await request(server).patch('/v1/admin/countries/BE').set('Cookie', cookie).send({ availability: 'APPROVED_FOR_BETA' }).expect(400);
    expect(refused.body.error).toBe('signoff_required');
    const ok = await request(server)
      .patch('/v1/admin/countries/BE')
      .set('Cookie', cookie)
      .send({ availability: 'APPROVED_FOR_BETA', legalSignOffBy: 'Test Lawyer', legalSignOffRef: 'memo-001', paymentSignOffBy: 'Test PSP', paymentSignOffRef: 'letter-001' })
      .expect(200);
    expect(ok.body.item.availability).toBe('APPROVED_FOR_BETA');
    // Put it back so other runs start clean.
    await request(server).patch('/v1/admin/countries/BE').set('Cookie', cookie).send({ availability: 'NOT_RESEARCHED', legalSignOffBy: null, legalSignOffRef: null, paymentSignOffBy: null, paymentSignOffRef: null }).expect(200);
  });

  it('handles data requests and records who handled them', async () => {
    const member = await registerMember(app);
    const created = await request(server).post('/v1/me/data-requests').set('Cookie', member.cookie).send({ type: 'ACCESS' }).expect(201);
    const cs = await createStaff(['COMPLIANCE_SPECIALIST']);
    const cookie = await staffSignIn(app, cs.email);
    const res = await request(server).patch(`/v1/admin/data-requests/${created.body.item.id}`).set('Cookie', cookie).send({ status: 'COMPLETED', resolution: 'Export sent' }).expect(200);
    expect(res.body.item.handledById).toBe(cs.id);
    const mine = await request(server).get('/v1/me/data-requests').set('Cookie', member.cookie).expect(200);
    expect(mine.body.items[0]).toMatchObject({ status: 'COMPLETED', resolution: 'Export sent' });
  });
});

describe('Database safety rules', () => {
  afterAll(() => prisma.$disconnect());

  it('the audit log cannot be edited or deleted, even directly in the database', async () => {
    const entry = await prisma.auditLog.create({ data: { action: 'test.entry' } });
    await expect(prisma.auditLog.update({ where: { id: entry.id }, data: { action: 'tampered' } })).rejects.toThrow(/append-only/);
    await expect(prisma.auditLog.delete({ where: { id: entry.id } })).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe('TRUNCATE "AuditLog"')).rejects.toThrow(/append-only/);
  });

  it('a country cannot be approved in the database without sign-off', async () => {
    await expect(prisma.country.update({ where: { code: 'DE' }, data: { availability: 'APPROVED_FOR_LAUNCH' } })).rejects.toThrow();
  });

  it('emails must be stored in lower case', async () => {
    await expect(prisma.user.create({ data: { email: 'Mixed@Example.test', passwordHash: 'x', displayName: 'x' } })).rejects.toThrow();
  });
});
