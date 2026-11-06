import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { AuthedRequest } from '../common/request';
import { isStaff, memberToken, SESSION_COOKIE } from './roles';

/** Requires a signed-in member session (web cookie, or bearer token from the mobile app). */
@Injectable()
export class MemberGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const resolved = await this.auth.resolveSession(memberToken(req), 'member');
    if (!resolved) throw new UnauthorizedException({ error: 'not_signed_in' });
    req.auth = resolved;
    return true;
  }
}

/** Staff session that has passed the password step but maybe not MFA yet. */
@Injectable()
export class StaffPasswordGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const resolved = await this.auth.resolveSession(req.cookies?.[SESSION_COOKIE.staff], 'staff');
    if (!resolved || !isStaff(resolved.roles)) throw new UnauthorizedException({ error: 'not_signed_in' });
    req.auth = resolved;
    return true;
  }
}

export const STAFF_ROLES_KEY = 'staffRoles';
/** Which staff roles may call this endpoint. Enforced by StaffGuard. */
export const StaffRoles = (...roles: Role[]) => SetMetadata(STAFF_ROLES_KEY, roles);

/** Fully authenticated staff: password + MFA in this session + one of the allowed roles. */
@Injectable()
export class StaffGuard implements CanActivate {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const resolved = await this.auth.resolveSession(req.cookies?.[SESSION_COOKIE.staff], 'staff');
    if (!resolved || !isStaff(resolved.roles)) throw new UnauthorizedException({ error: 'not_signed_in' });
    if (!resolved.session.mfaVerifiedAt) throw new UnauthorizedException({ error: 'mfa_required' });
    const allowed =
      this.reflector.getAllAndOverride<Role[] | undefined>(STAFF_ROLES_KEY, [ctx.getHandler(), ctx.getClass()]) ?? [];
    // Deny by default: an endpoint must declare its roles explicitly.
    if (allowed.length === 0 || !resolved.roles.some((r) => allowed.includes(r))) {
      throw new ForbiddenException({ error: 'insufficient_role' });
    }
    req.auth = resolved;
    return true;
  }
}
