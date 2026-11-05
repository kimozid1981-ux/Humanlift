import { z } from 'zod';

export const SUPPORTED_LOCALES = ['en', 'fr', 'es', 'pt', 'de', 'it', 'nl', 'ar'] as const;
export const ENABLED_LOCALES = ['en', 'fr'] as const; // Milestone 1

export const email = z.string().trim().toLowerCase().email().max(254);
// OWASP guidance: length over complexity rules. Breached-password check planned (M6).
export const password = z.string().min(12, 'password_too_short').max(128, 'password_too_long');
export const displayName = z.string().trim().min(1).max(60);
export const locale = z.enum(ENABLED_LOCALES);
export const countryCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/);
