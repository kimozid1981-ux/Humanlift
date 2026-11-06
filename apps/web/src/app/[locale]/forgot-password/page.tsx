import { LocaleParams, resolveLocale } from '@/lib/page';
import { ForgotForm } from './ForgotForm';

export default async function ForgotPage({ params }: LocaleParams) {
  const { t } = await resolveLocale(params);
  return (
    <div className="narrow">
      <h1>{t.auth.forgotTitle}</h1>
      <p>{t.auth.forgotIntro}</p>
      <ForgotForm t={{ auth: t.auth, common: t.common }} />
    </div>
  );
}
