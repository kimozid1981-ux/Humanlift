import Link from 'next/link';
import type { Dictionary } from '@/i18n/en';
import { LogoMark } from './Logo';
import { AuthNav } from './AuthNav';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header({ locale, t }: { locale: string; t: Dictionary }) {
  const n = t.nav;
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href={`/${locale}`} className="brand">
          <LogoMark />
          HumanLift
        </Link>
        <nav aria-label={n.main} className="main-nav">
          <ul>
            <li><Link href={`/${locale}/how-it-works`}>{n.howItWorks}</Link></li>
            <li><Link href={`/${locale}/applicants`}>{n.applicants}</Link></li>
            <li><Link href={`/${locale}/donors`}>{n.donors}</Link></li>
            <li><Link href={`/${locale}/requests`}>{n.requests}</Link></li>
            <li><Link href={`/${locale}/trust`}>{n.trust}</Link></li>
          </ul>
        </nav>
        <div className="header-actions">
          <LanguageSwitcher current={locale} label={n.language} />
          <AuthNav locale={locale} labels={{ signIn: n.signIn, register: n.register, account: n.account, signOut: n.signOut }} />
        </div>
      </div>
    </header>
  );
}

export function Footer({ locale, t }: { locale: string; t: Dictionary }) {
  const l = t.footer.links;
  const link = (slug: string, label: string) => (
    <li><Link href={`/${locale}/${slug}`}>{label}</Link></li>
  );
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-cols">
          <div>
            <h2>{t.footer.about}</h2>
            <ul>
              {link('about', l.about)}
              {link('countries', l.countries)}
              {link('transparency', l.transparency)}
              {link('safety', l.safety)}
            </ul>
          </div>
          <div>
            <h2>{t.footer.help}</h2>
            <ul>
              {link('contact', l.contact)}
              {link('faq', l.faq)}
              {link('report-abuse', l.reportAbuse)}
            </ul>
          </div>
          <div>
            <h2>{t.footer.legal}</h2>
            <ul>
              {link('privacy', l.privacy)}
              {link('terms', l.terms)}
              {link('cookies', l.cookies)}
              {link('accessibility', l.accessibility)}
              {link('legal', l.legalNotices)}
              {link('responsible-fundraising', l.responsible)}
            </ul>
          </div>
        </div>
        <p className="footer-note">{t.footer.note}</p>
      </div>
    </footer>
  );
}
