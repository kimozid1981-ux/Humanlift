import request from 'supertest';

describe('Rate limiting', () => {
  it('blocks repeated sign-in attempts from the same address', async () => {
    process.env.AUTH_RATE_LIMIT = '3';
    // Load the app after setting the limit so the decorator picks it up.
    const { bootApp, prisma } = require('./helpers');
    const app = await bootApp();
    const server = app.getHttpServer();
    const body = { email: 'nobody@example.test', password: 'whatever password' };
    for (let i = 0; i < 3; i++) await request(server).post('/v1/auth/login').send(body).expect(401);
    await request(server).post('/v1/auth/login').send(body).expect(429);
    await app.close();
    await prisma.$disconnect();
  });
});
