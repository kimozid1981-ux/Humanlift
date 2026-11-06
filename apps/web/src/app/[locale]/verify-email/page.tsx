import { LocaleParams, resolveLocale } from '@/lib/page';
import { VerifyEmail } from './VerifyEmail';

export default async function VerifyPage({ params, searchParams }: LocaleParams & { searchParams: Promise<{ token?: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const { token } = await searchParams;
  return (
    <div className="narrow">
      <h1>{t.auth.verifyTitle}</h1>
      <VerifyEmail locale={locale} token={token ?? ''} t={{ auth: t.auth, account: t.account }} />
    </div>
  );
}
