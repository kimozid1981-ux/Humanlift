import { notFound } from 'next/navigation';
import { isLocale, Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

export type LocaleParams = { params: Promise<{ locale: string }> };

export async function resolveLocale(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale: locale as Locale, t: getDictionary(locale) };
}

/** hreflang alternates for a path (without locale prefix). */
export function alternates(path: string) {
  const suffix = path ? `/${path}` : '';
  return { languages: { en: `/en${suffix}`, fr: `/fr${suffix}`, 'x-default': `/en${suffix}` } };
}
