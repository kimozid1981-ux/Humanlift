import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import { direction, ENABLED_LOCALES, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { Footer, Header } from '@/components/Chrome';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';

export function generateStaticParams() {
  return ENABLED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `HumanLift — ${t.meta.tagline}`, template: '%s — HumanLift' },
    description: t.home.intro,
    openGraph: { siteName: 'HumanLift', locale, type: 'website' },
    // Keep test environments out of search engines.
    robots: IS_PRODUCTION ? undefined : { index: false, follow: false },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <html lang={locale} dir={direction(locale)}>
      <body>
        <a className="skip-link" href="#main">{t.nav.skip}</a>
        {!IS_PRODUCTION && (
          <div className="test-banner" role="note">
            <div className="container">{t.banner.test}</div>
          </div>
        )}
        <Header locale={locale} t={t} />
        <main id="main" tabIndex={-1}>
          <div className="container">{children}</div>
        </main>
        <Footer locale={locale} t={t} />
      </body>
    </html>
  );
}
