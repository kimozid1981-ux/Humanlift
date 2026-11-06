import { alternates, resolveLocale } from '@/lib/page';
import { AbuseForm } from './AbuseForm';

export const metadata = { alternates: alternates('report-abuse') };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default async function ReportAbusePage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ url?: string }> }) {
  const { t } = await resolveLocale(params);
  // Pre-fill only with a page of this site (e.g. from a request's "Report" link).
  const { url } = await searchParams;
  const target = url && /^\/[a-z]{2}\/requests\/[0-9a-f-]{36}$/i.test(url) ? `${SITE_URL}${url}` : undefined;
  return (
    <div className="narrow">
      <h1>{t.abuse.title}</h1>
      <p>{t.abuse.intro}</p>
      <AbuseForm t={{ abuse: t.abuse, auth: t.auth, common: t.common, contact: t.contact }} targetUrl={target} />
    </div>
  );
}
