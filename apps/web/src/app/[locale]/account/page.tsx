import { LocaleParams, resolveLocale } from '@/lib/page';
import { AccountApp } from './AccountApp';

export const metadata = { robots: { index: false } };

export default async function AccountPage({ params }: LocaleParams) {
  const { locale, t } = await resolveLocale(params);
  return <AccountApp locale={locale} t={{ account: t.account, auth: t.auth, common: t.common }} />;
}
