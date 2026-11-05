import { alternates, LocaleParams, resolveLocale } from '@/lib/page';
import { AbuseForm } from './AbuseForm';

export const metadata = { alternates: alternates('report-abuse') };

export default async function ReportAbusePage({ params }: LocaleParams) {
  const { t } = await resolveLocale(params);
  return (
    <div className="narrow">
      <h1>{t.abuse.title}</h1>
      <p>{t.abuse.intro}</p>
      <AbuseForm t={{ abuse: t.abuse, auth: t.auth, common: t.common, contact: t.contact }} />
    </div>
  );
}
