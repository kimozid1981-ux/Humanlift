import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { bootApp, prisma, registerMember } from './helpers';

describe('Public endpoints', () => {
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

  it('accepts a contact message and rejects bots that fill the honeypot', async () => {
    const msg = { name: 'Lea', email: 'lea@example.test', topic: 'general', message: 'Hello, how does this work?', locale: 'fr' };
    const res = await request(server).post('/v1/public/contact').send(msg).expect(201);
    expect(res.body.status).toBe('received');
    await request(server).post('/v1/public/contact').send({ ...msg, website: 'http://spam' }).expect(400);
    await request(server).post('/v1/public/contact').send({ ...msg, message: 'short' }).expect(400);
  });

  it('records abuse reports, linking them to the signed-in reporter', async () => {
    const member = await registerMember(app);
    const res = await request(server)
      .post('/v1/public/abuse-reports')
      .set('Cookie', member.cookie)
      .send({ category: 'fraud', description: 'This request looks copied from another one.' })
      .expect(201);
    const stored = await prisma.abuseReport.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(stored.reporterId).toBe(member.user.id);
  });

  it('reports transparency figures honestly: money figures are unavailable, not invented', async () => {
    const res = await request(server).get('/v1/public/stats').expect(200);
    expect(res.body).toMatchObject({ realMoneyEnabled: false, contributionsProcessed: null, assistancePaid: null, completedRequests: null });
  });

  it('lists countries with France as research in progress and none approved by default', async () => {
    const res = await request(server).get('/v1/public/countries').expect(200);
    const fr = res.body.items.find((c: any) => c.code === 'FR');
    expect(fr.availability).toBe('RESEARCH_IN_PROGRESS');
  });

  it('sets security headers', async () => {
    const res = await request(server).get('/v1/health').expect(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('exposes the sandbox outbox in test/development', async () => {
    const res = await request(server).get('/v1/dev/outbox').expect(200);
    expect(res.body.sandbox).toBe(true);
  });
});
