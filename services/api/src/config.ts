import { z } from 'zod';

/** An empty line in a .env file means "not set". */
const emptyAsUnset = (v: unknown) => (v === '' ? undefined : v);

const schema = z.object({
  APP_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  WEB_BASE_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_BASE_URL: z.string().url().default('http://localhost:3001'),
  MFA_ENCRYPTION_KEY: z
    .string()
    .refine((v) => Buffer.from(v, 'base64').length === 32, 'MFA_ENCRYPTION_KEY must be 32 bytes, base64-encoded'),
  AUTH_RATE_LIMIT: z.coerce.number().int().positive().default(10),
  // Real email delivery through any standard SMTP service, e.g. smtps://user:pass@smtp.example.com:465
  SMTP_URL: z.preprocess(emptyAsUnset, z.string().url().optional()),
  // Sender shown to recipients, e.g. "HumanLift <no-reply@your-domain>"
  EMAIL_FROM: z.preprocess(emptyAsUnset, z.string().min(3).optional()),
});

export type AppConfig = z.infer<typeof schema> & {
  isProduction: boolean;
  cookieSecure: boolean;
  devOutboxEnabled: boolean;
  /** True when emails go to a real SMTP service instead of the sandbox outbox. */
  realEmail: boolean;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    // Fail fast with a readable message; never print the values themselves.
    const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid configuration: ${problems}`);
  }
  const c = parsed.data;
  const isProduction = c.APP_ENV === 'production';
  const needsRealEmail = c.APP_ENV === 'production' || c.APP_ENV === 'staging';
  if (needsRealEmail && (!c.SMTP_URL || !c.EMAIL_FROM)) {
    throw new Error('Invalid configuration: SMTP_URL and EMAIL_FROM are required in staging and production, so account emails are really delivered.');
  }
  return {
    ...c,
    isProduction,
    cookieSecure: c.APP_ENV === 'production' || c.APP_ENV === 'staging',
    // The sandbox email outbox must never exist in production.
    devOutboxEnabled: c.APP_ENV === 'development' || c.APP_ENV === 'test',
    realEmail: Boolean(c.SMTP_URL && c.EMAIL_FROM),
  };
}

export const CONFIG = Symbol('CONFIG');
