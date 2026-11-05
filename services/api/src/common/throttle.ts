import { Throttle } from '@nestjs/throttler';

/** Tighter per-IP limit for sign-in, registration, password reset and public forms. */
export const AUTH_RATE_LIMIT = Number(process.env.AUTH_RATE_LIMIT ?? 10);
export const SensitiveRateLimit = () => Throttle({ default: { limit: AUTH_RATE_LIMIT, ttl: 60_000 } });
