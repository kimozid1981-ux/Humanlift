'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ENABLED_LOCALES, LOCALE_NAMES } from '@/i18n/config';

export function LanguageSwitcher({ current, label }: { current: string; label: string }) {
  const pathname = usePathname() ?? `/${current}`;
  const rest = pathname.split('/').slice(2).join('/');
  return (
    <nav aria-label={label} className="lang-switch">
      {ENABLED_LOCALES.map((l) => (
        <Link key={l} href={`/${l}${rest ? `/${rest}` : ''}`} hrefLang={l} lang={l} aria-current={l === current ? 'true' : undefined}>
          {LOCALE_NAMES[l]}
        </Link>
      ))}
    </nav>
  );
}
