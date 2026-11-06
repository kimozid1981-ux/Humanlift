import type { Request } from 'express';
import type { Role, Session, User, UserRole } from '@prisma/client';

export type AuthedUser = User & { roles: UserRole[] };

export interface AuthedRequest extends Request {
  auth?: { user: AuthedUser; session: Session; roles: Role[] };
}

export function clientIp(req: Request): string | undefined {
  return req.ip ?? undefined;
}
