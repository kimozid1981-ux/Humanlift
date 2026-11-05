import './env';
import request from 'supertest';
import { prisma, STRONG_PASSWORD, uniqueEmail } from './helpers';
import { createApp } from '../src/app.factory';
import { loadConfig } from '../src/config';
import { MAILER, SmtpMailer } from '../src/mail/mailer';

// Regression test: the server must start in staging/production with real email switched on.
describe('server start-up with real email', () => {
  it('boots in staging mode with SMTP configured and uses the SMTP adapter', async () => {
    const config = loadConfig({
      ...process.env,
      APP_ENV: 'staging',
      SMTP_URL: 'smtp://127.0.0.1:2525',
      EMAIL_FROM: 'HumanLift <no-reply@example.test>',
    });
    const app = await createApp(config);
    await app.init();
    expect(app.get(MAILER)).toBeInstanceOf(SmtpMailer);
    await app.close();
  });

  it('still creates the account and signs the person in when the email service is unreachable', async () => {
    const config = loadConfig({
      ...process.env,
      APP_ENV: 'staging',
      SMTP_URL: 'smtp://127.0.0.1:1', // nothing listens here: delivery fails
      EMAIL_FROM: 'HumanLift <no-reply@example.test>',
    });
    const app = await createApp(config);
    await app.init();
    const email = uniqueEmail('smtp-down');
    const res = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email, password: STRONG_PASSWORD, displayName: 'Down', roles: ['DONOR'], acceptTerms: true });
    expect(res.status).toBe(201);
    expect(await prisma.user.findUnique({ where: { email } })).not.toBeNull();
    await app.close();
  });
});
