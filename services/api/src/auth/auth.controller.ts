import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { AuthService, ClientInfo } from './auth.service';
import { MemberGuard } from './guards';
import { clearSessionCookie, setSessionCookie } from './cookies';
import { isMobileClient, memberToken } from './roles';
import { AppConfig, CONFIG } from '../config';
import { ZodPipe } from '../common/zod.pipe';
import { AuthedRequest, clientIp } from '../common/request';
import { countryCode, displayName, email, locale, password } from '../common/schemas';
import { presentSelf } from '../users/present';
import { SensitiveRateLimit } from '../common/throttle';

const registerSchema = z.object({
  email,
  password,
  displayName,
  roles: z.array(z.enum([Role.APPLICANT, Role.DONOR])).min(1),
  locale: locale.default('en'),
  countryCode: countryCode.optional(),
  acceptTerms: z.literal(true),
});
const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
const tokenSchema = z.object({ token: z.string().min(10).max(200) });
const resetRequestSchema = z.object({ email });
const resetConfirmSchema = z.object({ token: z.string().min(10).max(200), password });

export function clientInfo(req: Request): ClientInfo {
  return { ip: clientIp(req), userAgent: req.headers['user-agent'] };
}

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(CONFIG) private readonly config: AppConfig,
  ) {}

  /** Web: HttpOnly cookie. Mobile app: token in the body, stored by the app in the OS secure storage. */
  private deliverSession(req: Request, res: Response, token: string, user: ReturnType<typeof presentSelf>) {
    if (isMobileClient(req)) return { user, sessionToken: token };
    setSessionCookie(res, 'member', token, this.config);
    return { user };
  }

  @Post('register')
  @SensitiveRateLimit()
  async register(
    @Body(new ZodPipe(registerSchema)) body: z.infer<typeof registerSchema>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.auth.register(body, clientInfo(req));
    return this.deliverSession(req, res, token, presentSelf(user));
  }

  @Post('login')
  @HttpCode(200)
  @SensitiveRateLimit()
  async login(
    @Body(new ZodPipe(loginSchema)) body: z.infer<typeof loginSchema>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.auth.login(body.email, body.password, 'member', clientInfo(req));
    return this.deliverSession(req, res, token, presentSelf(user));
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(memberToken(req), clientInfo(req));
    clearSessionCookie(res, 'member', this.config);
  }

  @Get('me')
  @UseGuards(MemberGuard)
  me(@Req() req: AuthedRequest) {
    return { user: presentSelf(req.auth!.user) };
  }

  @Post('verify-email')
  @HttpCode(204)
  @SensitiveRateLimit()
  async verifyEmail(@Body(new ZodPipe(tokenSchema)) body: z.infer<typeof tokenSchema>, @Req() req: Request) {
    await this.auth.verifyEmail(body.token, clientInfo(req));
  }

  @Post('resend-verification')
  @HttpCode(204)
  @SensitiveRateLimit()
  @UseGuards(MemberGuard)
  async resend(@Req() req: AuthedRequest) {
    await this.auth.sendVerificationEmail(req.auth!.user);
  }

  @Post('password-reset/request')
  @HttpCode(202)
  @SensitiveRateLimit()
  async requestReset(@Body(new ZodPipe(resetRequestSchema)) body: z.infer<typeof resetRequestSchema>, @Req() req: Request) {
    await this.auth.requestPasswordReset(body.email, clientInfo(req));
    return { status: 'if_account_exists_email_sent' };
  }

  @Post('password-reset/confirm')
  @HttpCode(204)
  @SensitiveRateLimit()
  async confirmReset(@Body(new ZodPipe(resetConfirmSchema)) body: z.infer<typeof resetConfirmSchema>, @Req() req: Request) {
    await this.auth.confirmPasswordReset(body.token, body.password, clientInfo(req));
  }
}
