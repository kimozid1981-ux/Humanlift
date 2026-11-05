import type { Request } from 'express';
import { Role } from '@prisma/client';

export const MEMBER_ROLES: Role[] = [Role.APPLICANT, Role.DONOR];
export const STAFF_ROLES: Role[] = [
  Role.VERIFICATION_SPECIALIST,
  Role.COMPLIANCE_SPECIALIST,
  Role.ADMINISTRATOR,
  Role.SUPER_ADMINISTRATOR,
];

export function isStaff(roles: Role[]): boolean {
  return roles.some((r) => STAFF_ROLES.includes(r));
}

export const SESSION_COOKIE = { member: 'hl_session', staff: 'hl_admin_session' } as const;
export const SESSION_TTL_MS = { member: 7 * 24 * 3600_000, staff: 8 * 3600_000 } as const;
export type SessionKind = keyof typeof SESSION_COOKIE;

/** Header the mobile app sends so the API returns the session token in the body instead of a cookie. */
export const MOBILE_CLIENT_HEADER = 'x-humanlift-client';

export function isMobileClient(req: Request): boolean {
  return req.headers[MOBILE_CLIENT_HEADER] === 'mobile';
}

/**
 * Member session token: from the web cookie, or from `Authorization: Bearer` (mobile app,
 * which keeps the token in the phone's secure storage). Bearer tokens are never sent
 * automatically by browsers, so they do not create a cross-site request risk.
 */
export function memberToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim() || undefined;
  return req.cookies?.[SESSION_COOKIE.member];
}
