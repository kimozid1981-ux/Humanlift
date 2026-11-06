import {
  BadRequestException,
  Logger,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, TokenPurpose, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { MAILER, Mailer } from '../mail/mailer';
import { passwordResetEmail, verificationEmail } from '../mail/templates';
import { AppConfig, CONFIG } from '../config';
import { decrypt, encrypt, randomToken, sha256 } from '../common/crypto';
import { AuthedUser } from '../common/request';
import { isStaff, SESSION_TTL_MS, SessionKind } from './roles';

const VERIFY_TTL_MS = 24 * 3600_000;
const RESET_TTL_MS = 3600_000;

// Used to keep login timing similar whether or not the email exists.
let dummyHash: Promise<string> | undefined;

export interface ClientInfo {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(CONFIG) private readonly config: AppConfig,
  ) {}

  hashPassword(password: string) {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async register(
    input: { email: string; password: string; displayName: string; roles: Role[]; locale: 'en' | 'fr'; countryCode?: string },
    client: ClientInfo,
  ) {
    const roles = Array.from(new Set(input.roles)).filter((r) => r === Role.APPLICANT || r === Role.DONOR);
    if (roles.length === 0) throw new BadRequestException({ error: 'role_required' });

    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      // Generic answer: the screen suggests signing in or resetting the password instead.
      await this.audit.record({ action: 'auth.register.duplicate', targetType: 'User', targetId: existing.id, ipAddress: client.ip });
      throw new BadRequestException({ error: 'registration_failed' });
    }

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await this.hashPassword(input.password),
        displayName: input.displayName,
        locale: input.locale,
        countryCode: input.countryCode,
        roles: { create: roles.map((role) => ({ role })) },
      },
      include: { roles: true },
    });
    await this.audit.record({ actorId: user.id, action: 'auth.register', targetType: 'User', targetId: user.id, ipAddress: client.ip, metadata: { roles } });
    try {
      await this.sendVerificationEmail(user);
    } catch (err) {
      // The account exists either way. Failing here would make a retry say "email already used";
      // the member can ask for a new link from the account page ("resend confirmation").
      this.logger.error(`verification email failed after registration: ${err instanceof Error ? err.message : err}`);
    }
    const token = await this.createSession(user.id, 'member', client);
    return { user, token };
  }

  async login(email: string, password: string, kind: SessionKind, client: ClientInfo) {
    const user = await this.prisma.user.findUnique({ where: { email }, include: { roles: true } });
    if (!user) {
      dummyHash ??= this.hashPassword('not-a-real-password-just-for-timing');
      await argon2.verify(await dummyHash, password).catch(() => false);
      await this.audit.record({ action: 'auth.login.failed', ipAddress: client.ip, metadata: { reason: 'unknown_email', kind } });
      throw new UnauthorizedException({ error: 'invalid_credentials' });
    }
    const ok = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!ok) {
      await this.audit.record({ actorId: user.id, action: 'auth.login.failed', targetType: 'User', targetId: user.id, ipAddress: client.ip, metadata: { reason: 'bad_password', kind } });
      throw new UnauthorizedException({ error: 'invalid_credentials' });
    }
    if (user.status !== UserStatus.ACTIVE) {
      await this.audit.record({ actorId: user.id, action: 'auth.login.blocked', targetType: 'User', targetId: user.id, ipAddress: client.ip, metadata: { status: user.status, kind } });
      throw new ForbiddenException({ error: 'account_not_active' });
    }
    const roles = user.roles.map((r) => r.role);
    if (kind === 'staff' && !isStaff(roles)) {
      await this.audit.record({ actorId: user.id, action: 'auth.login.failed', targetType: 'User', targetId: user.id, ipAddress: client.ip, metadata: { reason: 'not_staff', kind } });
      // Same answer as a wrong password: do not reveal which accounts are staff.
      throw new UnauthorizedException({ error: 'invalid_credentials' });
    }
    const token = await this.createSession(user.id, kind, client);
    await this.audit.record({ actorId: user.id, action: kind === 'staff' ? 'auth.staff_login.password_ok' : 'auth.login', targetType: 'User', targetId: user.id, ipAddress: client.ip });
    return { user, token };
  }

  private async createSession(userId: string, kind: SessionKind, client: ClientInfo) {
    const token = randomToken();
    await this.prisma.session.create({
      data: {
        userId,
        tokenHash: sha256(token),
        isStaff: kind === 'staff',
        ipAddress: client.ip,
        userAgent: client.userAgent?.slice(0, 300),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS[kind]),
      },
    });
    return token;
  }

  async resolveSession(token: string | undefined, kind: SessionKind) {
    if (!token) return null;
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: sha256(token) },
      include: { user: { include: { roles: true } } },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;
    if (session.isStaff !== (kind === 'staff')) return null;
    if (session.user.status !== UserStatus.ACTIVE) return null;
    const { user, ...rest } = session;
    return { session: rest, user: user as AuthedUser, roles: user.roles.map((r) => r.role) };
  }

  async logout(token: string | undefined, client: ClientInfo) {
    if (!token) return;
    const session = await this.prisma.session.findUnique({ where: { tokenHash: sha256(token) } });
    if (!session || session.revokedAt) return;
    await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    await this.audit.record({ actorId: session.userId, action: 'auth.logout', targetType: 'Session', targetId: session.id, ipAddress: client.ip });
  }

  // ---- Email verification -------------------------------------------------

  private async issueToken(userId: string, purpose: TokenPurpose, ttlMs: number) {
    const token = randomToken();
    await this.prisma.oneTimeToken.create({
      data: { userId, purpose, tokenHash: sha256(token), expiresAt: new Date(Date.now() + ttlMs) },
    });
    return token;
  }

  async sendVerificationEmail(user: { id: string; email: string; displayName: string; locale: string; emailVerifiedAt: Date | null }) {
    if (user.emailVerifiedAt) return;
    const token = await this.issueToken(user.id, TokenPurpose.EMAIL_VERIFICATION, VERIFY_TTL_MS);
    const locale = user.locale === 'fr' ? 'fr' : 'en';
    const link = `${this.config.WEB_BASE_URL}/${locale}/verify-email?token=${encodeURIComponent(token)}`;
    await this.mailer.send({ to: user.email, ...verificationEmail(locale, user.displayName, link) });
  }

  private async consumeToken(token: string, purpose: TokenPurpose) {
    const record = await this.prisma.oneTimeToken.findUnique({ where: { tokenHash: sha256(token) } });
    if (!record || record.purpose !== purpose || record.usedAt || record.expiresAt <= new Date()) {
      throw new BadRequestException({ error: 'invalid_or_expired_token' });
    }
    // Conditional update guards against the same token being used twice concurrently.
    const { count } = await this.prisma.oneTimeToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: new Date() } });
    if (count !== 1) throw new BadRequestException({ error: 'invalid_or_expired_token' });
    return record;
  }

  async verifyEmail(token: string, client: ClientInfo) {
    const record = await this.consumeToken(token, TokenPurpose.EMAIL_VERIFICATION);
    await this.prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
    await this.audit.record({ actorId: record.userId, action: 'auth.email_verified', targetType: 'User', targetId: record.userId, ipAddress: client.ip });
  }

  // ---- Password reset -----------------------------------------------------

  async requestPasswordReset(email: string, client: ClientInfo) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always behave the same to the caller, whether or not the account exists.
    if (!user || user.status !== UserStatus.ACTIVE) return;
    const token = await this.issueToken(user.id, TokenPurpose.PASSWORD_RESET, RESET_TTL_MS);
    const locale = user.locale === 'fr' ? 'fr' : 'en';
    const link = `${this.config.WEB_BASE_URL}/${locale}/reset-password?token=${encodeURIComponent(token)}`;
    await this.mailer.send({ to: user.email, ...passwordResetEmail(locale, user.displayName, link) });
    await this.audit.record({ actorId: user.id, action: 'auth.password_reset.requested', targetType: 'User', targetId: user.id, ipAddress: client.ip });
  }

  async confirmPasswordReset(token: string, newPassword: string, client: ClientInfo) {
    const record = await this.consumeToken(token, TokenPurpose.PASSWORD_RESET);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await this.hashPassword(newPassword) } }),
      // Sign out everywhere after a reset.
      this.prisma.session.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    await this.audit.record({ actorId: record.userId, action: 'auth.password_reset.completed', targetType: 'User', targetId: record.userId, ipAddress: client.ip });
  }

  async changePassword(user: AuthedUser, currentSessionId: string, current: string, next: string, client: ClientInfo) {
    const ok = await argon2.verify(user.passwordHash, current).catch(() => false);
    if (!ok) throw new BadRequestException({ error: 'current_password_incorrect' });
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: await this.hashPassword(next) } }),
      this.prisma.session.updateMany({ where: { userId: user.id, revokedAt: null, NOT: { id: currentSessionId } }, data: { revokedAt: new Date() } }),
    ]);
    await this.audit.record({ actorId: user.id, action: 'auth.password_changed', targetType: 'User', targetId: user.id, ipAddress: client.ip });
  }

  // ---- Staff MFA (TOTP) ---------------------------------------------------

  async beginMfaEnrolment(user: AuthedUser, client: ClientInfo) {
    if (user.mfaEnabledAt) throw new BadRequestException({ error: 'mfa_already_enabled' });
    const secret = authenticator.generateSecret(20);
    await this.prisma.user.update({ where: { id: user.id }, data: { mfaSecretEnc: encrypt(secret, this.config.MFA_ENCRYPTION_KEY) } });
    const otpauthUrl = authenticator.keyuri(user.email, 'HumanLift Admin', secret);
    await this.audit.record({ actorId: user.id, action: 'auth.mfa.enrolment_started', targetType: 'User', targetId: user.id, ipAddress: client.ip });
    return { otpauthUrl, qrCodeDataUrl: await QRCode.toDataURL(otpauthUrl), secret };
  }

  async verifyMfa(user: AuthedUser, sessionId: string, code: string, client: ClientInfo) {
    if (!user.mfaSecretEnc) throw new BadRequestException({ error: 'mfa_not_enrolled' });
    const secret = decrypt(user.mfaSecretEnc, this.config.MFA_ENCRYPTION_KEY);
    authenticator.options = { window: 1 };
    if (!authenticator.verify({ token: code, secret })) {
      await this.audit.record({ actorId: user.id, action: 'auth.mfa.failed', targetType: 'User', targetId: user.id, ipAddress: client.ip });
      throw new UnauthorizedException({ error: 'invalid_mfa_code' });
    }
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.session.update({ where: { id: sessionId }, data: { mfaVerifiedAt: now } }),
      ...(user.mfaEnabledAt ? [] : [this.prisma.user.update({ where: { id: user.id }, data: { mfaEnabledAt: now } })]),
    ]);
    await this.audit.record({
      actorId: user.id,
      action: user.mfaEnabledAt ? 'auth.mfa.verified' : 'auth.mfa.enabled',
      targetType: 'User',
      targetId: user.id,
      ipAddress: client.ip,
    });
  }
}
