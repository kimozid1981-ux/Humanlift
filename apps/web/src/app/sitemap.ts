import type { MetadataRoute } from 'next';
import { ENABLED_LOCALES } from '@/i18n/config';
import { CONTENT_SLUGS } from '@/i18n/dictionaries';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const PUBLIC_PATHS = ['', 'requests', 'transparency', 'countries', 'contact', 'report-abuse', 'register', 'login', ...CONTENT_SLUGS];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((p) => {
    const suffix = p ? `/${p}` : '';
    return {
      url: `${SITE_URL}/en${suffix}`,
      alternates: { languages: Object.fromEntries(ENABLED_LOCALES.map((l) => [l, `${SITE_URL}/${l}${suffix}`])) },
    };
  });
}
