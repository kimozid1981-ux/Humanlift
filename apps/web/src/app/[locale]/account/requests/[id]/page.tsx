import { resolveLocale } from '@/lib/page';
import { RequestDetailApp } from './RequestDetailApp';

export const metadata = { robots: { index: false } };

export default async function MyRequestDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const { id } = await params;
  return <RequestDetailApp id={id} locale={locale} t={{ helpRequests: t.helpRequests, common: t.common }} />;
}
