import { LocaleParams, resolveLocale } from '@/lib/page';
import { LoginForm } from './LoginForm';

export default async function LoginPage({ params }: LocaleParams) {
  const { locale, t } = await resolveLocale(params);
  return (
    <div className="narrow">
      <h1>{t.auth.loginTitle}</h1>
      <LoginForm locale={locale} t={{ auth: t.auth, common: t.common }} />
    </div>
  );
}
