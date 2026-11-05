import { INestApplication } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import request from 'supertest';
import { authenticator } from 'otplib';
import { randomUUID } from 'crypto';
import { createApp } from '../src/app.factory';
import { seedCountries } from '../prisma/seed';

export const prisma = new PrismaClient();

export async function bootApp(): Promise<INestApplication> {
  await seedCountries(prisma);
  const app = await createApp();
  await app.init();
  return app;
}

export function uniqueEmail(prefix = 'user') {
  return `${prefix}.${randomUUID().slice(0, 8)}@example.test`;
}

export const STRONG_PASSWORD = 'correct horse battery staple';

/** Returns the cookie header value for a cookie set in a response. */
export function cookieFrom(res: request.Response, name: string): string {
  const raw = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  const found = raw.find((c) => c.startsWith(`${name}=`));
  if (!found) throw new Error(`cookie ${name} not set`);
  return found.split(';')[0];
}

export async function registerMember(app: INestApplication, roles: Role[] = ['DONOR'], email = uniqueEmail()) {
  const res = await request(app.getHttpServer())
    .post('/v1/auth/register')
    .send({ email, password: STRONG_PASSWORD, displayName: 'Test Member', roles, locale: 'en', acceptTerms: true })
    .expect(201);
  return { email, cookie: cookieFrom(res, 'hl_session'), user: res.body.user };
}

export async function createStaff(roles: Role[], email = uniqueEmail('staff')) {
  const user = await prisma.user.create({
    data: {
      email,
      displayName: 'Staff',
      passwordHash: await argon2.hash(STRONG_PASSWORD, { type: argon2.argon2id }),
      emailVerifiedAt: new Date(),
      roles: { create: roles.map((role) => ({ role })) },
    },
  });
  return { email, id: user.id };
}

/** Full staff sign-in: password, MFA enrolment, TOTP code. Returns the admin cookie. */
export async function staffSignIn(app: INestApplication, email: string) {
  const server = app.getHttpServer();
  const login = await request(server).post('/v1/admin/auth/login').send({ email, password: STRONG_PASSWORD }).expect(200);
  const cookie = cookieFrom(login, 'hl_admin_session');
  const enrol = await request(server).post('/v1/admin/auth/mfa/enrol').set('Cookie', cookie).expect(201);
  const code = authenticator.generate(enrol.body.manualEntryKey);
  await request(server).post('/v1/admin/auth/mfa/verify').set('Cookie', cookie).send({ code }).expect(204);
  return cookie;
}

export async function latestEmailTo(to: string) {
  return prisma.devOutboxEmail.findFirstOrThrow({ where: { to }, orderBy: { createdAt: 'desc' } });
}

export function tokenFromEmail(body: string): string {
  const match = body.match(/token=([A-Za-z0-9_\-%]+)/);
  if (!match) throw new Error('no token in email');
  return decodeURIComponent(match[1]);
}
