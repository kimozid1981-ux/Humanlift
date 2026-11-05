import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, ENABLED_LOCALES, isLocale } from './i18n/config';

function preferredLocale(req: NextRequest): string {
  const header = req.headers.get('accept-language') ?? '';
  for (const part of header.split(',')) {
    const code = part.split(';')[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}

/** Every page lives under a language prefix (/en, /fr). Send other paths to the visitor's language. */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split('/')[1] ?? '';
  if ((ENABLED_LOCALES as readonly string[]).includes(first)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/${preferredLocale(req)}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};
