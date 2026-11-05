import en from './en';
import fr from './fr';
import type { Locale } from './config';

const dictionaries = { en, fr } as const;
export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
export const CONTENT_SLUGS = Object.keys(en.pages);
