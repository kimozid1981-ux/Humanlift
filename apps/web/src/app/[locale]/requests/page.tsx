import { alternates, LocaleParams, resolveLocale } from '@/lib/page';

export const metadata = { alternates: alternates('requests') };

/** Published requests arrive in Milestone 3. Until then, an honest empty state — never sample data. */
export default async function RequestsPage({ params }: LocaleParams) {
  const { t } = await resolveLocale(params);
  return (
    <>
      <h1>{t.requests.title}</h1>
      <p>{t.requests.intro}</p>
      <div className="notice notice-info" role="status">{t.requests.empty}</div>
    </>
  );
}
