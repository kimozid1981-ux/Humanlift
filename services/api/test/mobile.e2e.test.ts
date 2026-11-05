import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { bootApp, prisma, STRONG_PASSWORD, uniqueEmail } from './helpers';

describe('Mobile app sessions (bearer token)', () => {
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

  it('returns the token in the body and sets no cookie for the mobile client', async () => {
    const email = uniqueEmail('mobile');
    const res = await request(server)
      .post('/v1/auth/register')
      .set('X-HumanLift-Client', 'mobile')
      .send({ email, password: STRONG_PASSWORD, displayName: 'Mobile', roles: ['APPLICANT'], locale: 'en', acceptTerms: true })
      .expect(201);
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(typeof res.body.sessionToken).toBe('string');
    const token = res.body.sessionToken;
    await request(server).get('/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    await request(server).patch('/v1/me').set('Authorization', `Bearer ${token}`).send({ displayName: 'Phone user' }).expect(200);
    await request(server).post('/v1/auth/logout').set('Authorization', `Bearer ${token}`).expect(204);
    await request(server).get('/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('web clients never receive the token in the body', async () => {
    const email = uniqueEmail('web');
    const res = await request(server)
      .post('/v1/auth/register')
      .send({ email, password: STRONG_PASSWORD, displayName: 'Web', roles: ['DONOR'], locale: 'en', acceptTerms: true })
      .expect(201);
    expect(res.body.sessionToken).toBeUndefined();
    const login = await request(server).post('/v1/auth/login').send({ email, password: STRONG_PASSWORD }).expect(200);
    expect(login.body.sessionToken).toBeUndefined();
  });

  it('rejects invalid bearer tokens and never accepts a member token on admin endpoints', async () => {
    await request(server).get('/v1/auth/me').set('Authorization', 'Bearer not-a-real-token').expect(401);
    const res = await request(server)
      .post('/v1/auth/register')
      .set('X-HumanLift-Client', 'mobile')
      .send({ email: uniqueEmail(), password: STRONG_PASSWORD, displayName: 'M', roles: ['DONOR'], locale: 'en', acceptTerms: true })
      .expect(201);
    await request(server).get('/v1/admin/users').set('Authorization', `Bearer ${res.body.sessionToken}`).expect(401);
  });
});
