/**
 * Locale configuration. Milestone 1 ships English and French.
 * The other six launch languages are declared so routing, RTL and formatting
 * are ready; they are enabled by adding a dictionary and listing them in ENABLED.
 */
export const ALL_LOCALES = ['en', 'fr', 'es', 'pt', 'de', 'it', 'nl', 'ar'] as const;
export const ENABLED_LOCALES = ['en', 'fr'] as const;
export type Locale = (typeof ENABLED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
const RTL = new Set<string>(['ar']);

export const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  de: 'Deutsch',
  it: 'Italiano',
  nl: 'Nederlands',
  ar: 'العربية',
};

export function isLocale(value: string): value is Locale {
  return (ENABLED_LOCALES as readonly string[]).includes(value);
}

export function direction(locale: string): 'ltr' | 'rtl' {
  return RTL.has(locale) ? 'rtl' : 'ltr';
}

export function formatDate(date: Date | string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}
