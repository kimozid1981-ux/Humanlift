import type { Response } from 'express';
import { AppConfig } from '../config';
import { SESSION_COOKIE, SESSION_TTL_MS, SessionKind } from './roles';

export function setSessionCookie(res: Response, kind: SessionKind, token: string, config: AppConfig) {
  res.cookie(SESSION_COOKIE[kind], token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS[kind],
  });
}

export function clearSessionCookie(res: Response, kind: SessionKind, config: AppConfig) {
  res.clearCookie(SESSION_COOKIE[kind], { httpOnly: true, secure: config.cookieSecure, sameSite: 'lax', path: '/' });
}
