import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { StaffPasswordGuard } from '../auth/guards';
import { clearSessionCookie, setSessionCookie } from '../auth/cookies';
import { SESSION_COOKIE } from '../auth/roles';
import { clientInfo } from '../auth/auth.controller';
import { AppConfig, CONFIG } from '../config';
import { ZodPipe } from '../common/zod.pipe';
import { AuthedRequest } from '../common/request';
import { email } from '../common/schemas';
import { SensitiveRateLimit } from '../common/throttle';

const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
const codeSchema = z.object({ code: z.string().regex(/^\d{6}$/) });

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(CONFIG) private readonly config: AppConfig,
  ) {}

  @Post('login')
  @HttpCode(200)
  @SensitiveRateLimit()
  async login(@Body(new ZodPipe(loginSchema)) body: z.infer<typeof loginSchema>, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.login(body.email, body.password, 'staff', clientInfo(req));
    setSessionCookie(res, 'staff', token, this.config);
    return { next: user.mfaEnabledAt ? 'mfa_verify' : 'mfa_enrol' };
  }

  /** Who is signed in, and whether MFA is still needed. */
  @Get('session')
  @UseGuards(StaffPasswordGuard)
  session(@Req() req: AuthedRequest) {
    const { user, session, roles } = req.auth!;
    return {
      email: user.email,
      displayName: user.displayName,
      roles,
      mfaEnabled: Boolean(user.mfaEnabledAt),
      mfaVerified: Boolean(session.mfaVerifiedAt),
    };
  }

  @Post('mfa/enrol')
  @SensitiveRateLimit()
  @UseGuards(StaffPasswordGuard)
  async enrol(@Req() req: AuthedRequest) {
    const { qrCodeDataUrl, secret } = await this.auth.beginMfaEnrolment(req.auth!.user, clientInfo(req));
    // The secret is shown once so it can be typed manually if the QR code cannot be scanned.
    return { qrCodeDataUrl, manualEntryKey: secret };
  }

  @Post('mfa/verify')
  @HttpCode(204)
  @SensitiveRateLimit()
  @UseGuards(StaffPasswordGuard)
  async verify(@Body(new ZodPipe(codeSchema)) body: z.infer<typeof codeSchema>, @Req() req: AuthedRequest) {
    await this.auth.verifyMfa(req.auth!.user, req.auth!.session.id, body.code, clientInfo(req));
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[SESSION_COOKIE.staff], clientInfo(req));
    clearSessionCookie(res, 'staff', this.config);
  }
}
