import { LocaleParams, resolveLocale } from '@/lib/page';
import { RegisterForm } from './RegisterForm';
import { serverGet } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({ params }: LocaleParams) {
  const { locale, t } = await resolveLocale(params);
  const countries = await serverGet<{ items: { code: string; name: string }[] }>('/public/countries');
  const names = new Intl.DisplayNames([locale], { type: 'region' });
  const options = (countries?.items ?? []).map((c) => ({ code: c.code, label: names.of(c.code) ?? c.name })).sort((a, b) => a.label.localeCompare(b.label, locale));
  return (
    <div className="narrow">
      <h1>{t.auth.registerTitle}</h1>
      <p>{t.auth.registerIntro}</p>
      <RegisterForm locale={locale} countries={options} t={{ auth: t.auth, common: t.common }} />
    </div>
  );
}
