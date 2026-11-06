import { alternates, LocaleParams, resolveLocale } from '@/lib/page';
import { ContactForm } from './ContactForm';

export const metadata = { alternates: alternates('contact') };

export default async function ContactPage({ params }: LocaleParams) {
  const { locale, t } = await resolveLocale(params);
  return (
    <div className="narrow">
      <h1>{t.contact.title}</h1>
      <p>{t.contact.intro}</p>
      <div className="notice notice-warning" role="note">{t.contact.emergency}</div>
      <ContactForm locale={locale} t={{ contact: t.contact, auth: t.auth, common: t.common }} />
    </div>
  );
}
