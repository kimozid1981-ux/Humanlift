import { z } from 'zod';

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
});

export type AppConfig = z.infer<typeof schema> & {
  isProduction: boolean;
  cookieSecure: boolean;
  devOutboxEnabled: boolean;
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
  return {
    ...c,
    isProduction,
    cookieSecure: c.APP_ENV === 'production' || c.APP_ENV === 'staging',
    // The sandbox email outbox must never exist in production.
    devOutboxEnabled: c.APP_ENV === 'development' || c.APP_ENV === 'test',
  };
}

export const CONFIG = Symbol('CONFIG');
