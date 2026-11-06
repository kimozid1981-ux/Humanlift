import { LocaleParams, resolveLocale } from '@/lib/page';
import { MyRequestsApp } from './MyRequestsApp';

export const metadata = { robots: { index: false } };

export default async function MyRequestsPage({ params }: LocaleParams) {
  const { locale, t } = await resolveLocale(params);
  return <MyRequestsApp locale={locale} t={{ helpRequests: t.helpRequests, common: t.common }} />;
}
