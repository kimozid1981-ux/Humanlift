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
