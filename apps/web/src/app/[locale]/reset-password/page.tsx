import { LocaleParams, resolveLocale } from '@/lib/page';
import { ResetForm } from './ResetForm';

export default async function ResetPage({ params, searchParams }: LocaleParams & { searchParams: Promise<{ token?: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const { token } = await searchParams;
  return (
    <div className="narrow">
      <h1>{t.auth.resetTitle}</h1>
      <ResetForm locale={locale} token={token ?? ''} t={{ auth: t.auth, common: t.common }} />
    </div>
  );
}
