import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { bootApp, cookieFrom, latestEmailTo, prisma, registerMember, STRONG_PASSWORD, tokenFromEmail, uniqueEmail } from './helpers';

describe('Member accounts', () => {
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

  it('registers a donor, sets a secure session cookie and never returns the password hash', async () => {
    const email = uniqueEmail();
    const res = await request(server)
      .post('/v1/auth/register')
      .send({ email, password: STRONG_PASSWORD, displayName: 'Ana', roles: ['DONOR'], locale: 'fr', acceptTerms: true })
      .expect(201);
    expect(res.body.user).toMatchObject({ email, roles: ['DONOR'], emailVerified: false, locale: 'fr' });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|argon2/);
    const setCookie = String(res.headers['set-cookie']);
    expect(setCookie).toMatch(/hl_session=/);
    expect(setCookie).toMatch(/HttpOnly/);
    expect(setCookie).toMatch(/SameSite=Lax/);
    const stored = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(stored.passwordHash.startsWith('$argon2id$')).toBe(true);
  });

  it('stores only a hash of the session token', async () => {
    const { cookie, user } = await registerMember(app);
    const token = cookie.split('=')[1];
    const sessions = await prisma.session.findMany({ where: { userId: user.id } });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].tokenHash).not.toEqual(token);
    expect(sessions[0].tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects weak input: short password, missing terms, staff role self-assignment', async () => {
    const base = { email: uniqueEmail(), displayName: 'X', locale: 'en', acceptTerms: true, roles: ['DONOR'], password: STRONG_PASSWORD };
    await request(server).post('/v1/auth/register').send({ ...base, password: 'short' }).expect(400);
    await request(server).post('/v1/auth/register').send({ ...base, acceptTerms: false }).expect(400);
    await request(server).post('/v1/auth/register').send({ ...base, roles: ['SUPER_ADMINISTRATOR'] }).expect(400);
  });

  it('does not allow registering the same email twice (case-insensitive)', async () => {
    const { email } = await registerMember(app);
    await request(server)
      .post('/v1/auth/register')
      .send({ email: email.toUpperCase(), password: STRONG_PASSWORD, displayName: 'Dup', roles: ['DONOR'], locale: 'en', acceptTerms: true })
      .expect(400);
  });

  it('verifies email through the link sent by the sandbox mailer, and the link works only once', async () => {
    const { email, cookie } = await registerMember(app);
    const mail = await latestEmailTo(email);
    expect(mail.subject).toMatch(/Confirm your email/);
    const token = tokenFromEmail(mail.body);
    await request(server).post('/v1/auth/verify-email').send({ token }).expect(204);
    await request(server).post('/v1/auth/verify-email').send({ token }).expect(400);
    const me = await request(server).get('/v1/auth/me').set('Cookie', cookie).expect(200);
    expect(me.body.user.emailVerified).toBe(true);
  });

  it('gives the same answer for a wrong password and an unknown email', async () => {
    const { email } = await registerMember(app);
    const wrong = await request(server).post('/v1/auth/login').send({ email, password: 'wrong password here' }).expect(401);
    const unknown = await request(server).post('/v1/auth/login').send({ email: uniqueEmail(), password: 'wrong password here' }).expect(401);
    expect(wrong.body).toEqual(unknown.body);
    const failures = await prisma.auditLog.count({ where: { action: 'auth.login.failed' } });
    expect(failures).toBeGreaterThanOrEqual(2);
  });

  it('logs in, and logout revokes the session on the server', async () => {
    const { email } = await registerMember(app);
    const login = await request(server).post('/v1/auth/login').send({ email, password: STRONG_PASSWORD }).expect(200);
    const cookie = cookieFrom(login, 'hl_session');
    await request(server).get('/v1/auth/me').set('Cookie', cookie).expect(200);
    await request(server).post('/v1/auth/logout').set('Cookie', cookie).expect(204);
    await request(server).get('/v1/auth/me').set('Cookie', cookie).expect(401);
  });

  it('resets a password via emailed link and signs out all existing sessions', async () => {
    const { email, cookie } = await registerMember(app);
    const res = await request(server).post('/v1/auth/password-reset/request').send({ email }).expect(202);
    // Unknown emails get the identical response.
    const res2 = await request(server).post('/v1/auth/password-reset/request').send({ email: uniqueEmail() }).expect(202);
    expect(res.body).toEqual(res2.body);
    const token = tokenFromEmail((await latestEmailTo(email)).body);
    await request(server).post('/v1/auth/password-reset/confirm').send({ token, password: 'a brand new long password' }).expect(204);
    await request(server).get('/v1/auth/me').set('Cookie', cookie).expect(401);
    await request(server).post('/v1/auth/login').send({ email, password: STRONG_PASSWORD }).expect(401);
    await request(server).post('/v1/auth/login').send({ email, password: 'a brand new long password' }).expect(200);
  });

  it('updates the profile, adds the applicant role, and exports personal data', async () => {
    const { cookie } = await registerMember(app, ['DONOR']);
    const upd = await request(server).patch('/v1/me').set('Cookie', cookie).send({ displayName: 'New Name', locale: 'fr', countryCode: 'fr' }).expect(200);
    expect(upd.body.user).toMatchObject({ displayName: 'New Name', locale: 'fr', countryCode: 'FR' });
    const role = await request(server).post('/v1/me/roles').set('Cookie', cookie).send({ role: 'APPLICANT' }).expect(201);
    expect(role.body.user.roles.sort()).toEqual(['APPLICANT', 'DONOR']);
    await request(server).post('/v1/me/roles').set('Cookie', cookie).send({ role: 'ADMINISTRATOR' }).expect(400);
    const exp = await request(server).get('/v1/me/export').set('Cookie', cookie).expect(200);
    expect(exp.body.profile.displayName).toBe('New Name');
    expect(JSON.stringify(exp.body)).not.toMatch(/passwordHash|tokenHash|mfaSecret/);
  });

  it('creates a data deletion request and refuses a duplicate while one is open', async () => {
    const { cookie } = await registerMember(app);
    await request(server).post('/v1/me/data-requests').set('Cookie', cookie).send({ type: 'DELETION' }).expect(201);
    await request(server).post('/v1/me/data-requests').set('Cookie', cookie).send({ type: 'DELETION' }).expect(400);
    const list = await request(server).get('/v1/me/data-requests').set('Cookie', cookie).expect(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].status).toBe('RECEIVED');
  });

  it('changes password and keeps only the current session', async () => {
    const { email, cookie } = await registerMember(app);
    const other = cookieFrom(await request(server).post('/v1/auth/login').send({ email, password: STRONG_PASSWORD }), 'hl_session');
    await request(server).post('/v1/me/password').set('Cookie', cookie).send({ currentPassword: 'nope', newPassword: 'another long password' }).expect(400);
    await request(server).post('/v1/me/password').set('Cookie', cookie).send({ currentPassword: STRONG_PASSWORD, newPassword: 'another long password' }).expect(204);
    await request(server).get('/v1/auth/me').set('Cookie', cookie).expect(200);
    await request(server).get('/v1/auth/me').set('Cookie', other).expect(401);
  });

  it('member sessions cannot reach admin endpoints', async () => {
    const { cookie } = await registerMember(app);
    await request(server).get('/v1/admin/users').set('Cookie', cookie).expect(401);
  });
});
