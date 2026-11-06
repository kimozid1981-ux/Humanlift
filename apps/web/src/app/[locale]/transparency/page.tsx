import { alternates, LocaleParams, resolveLocale } from '@/lib/page';
import { serverGet } from '@/lib/server-api';

export const dynamic = 'force-dynamic';
export const metadata = { alternates: alternates('transparency') };

type Stats = { contributionsProcessed: number | null; assistancePaid: number | null; completedRequests: number | null; countriesAvailable: number; generatedAt: string };

export default async function TransparencyPage({ params }: LocaleParams) {
  const { t } = await resolveLocale(params);
  const tr = t.transparency;
  const stats = await serverGet<Stats>('/public/stats');
  const show = (v: number | null | undefined) => (v === null || v === undefined ? t.common.notAvailableYet : String(v));
  return (
    <>
      <h1>{tr.title}</h1>
      <p>{tr.intro}</p>
      <h2>{tr.statsTitle}</h2>
      <dl className="grid">
        <div className="card"><dt>{tr.contributions}</dt><dd className="stat">{show(stats?.contributionsProcessed)}</dd></div>
        <div className="card"><dt>{tr.paid}</dt><dd className="stat">{show(stats?.assistancePaid)}</dd></div>
        <div className="card"><dt>{tr.completed}</dt><dd className="stat">{show(stats?.completedRequests)}</dd></div>
        <div className="card"><dt>{tr.countriesOpen}</dt><dd className="stat" data-testid="countries-open">{show(stats?.countriesAvailable)}</dd></div>
      </dl>
      <div className="notice notice-info" role="note">{tr.noMoney}</div>
      <h2>{tr.feesTitle}</h2>
      <ul>{tr.fees.map((f) => <li key={f}>{f}</li>)}</ul>
    </>
  );
}
