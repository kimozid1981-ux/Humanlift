import { notFound } from 'next/navigation';
import { resolveLocale } from '@/lib/page';
import { serverGet } from '@/lib/server-api';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';

type PublicRequest = {
  id: string;
  title: string;
  summary: string;
  category: string;
  countryCode: string;
  countryName: string;
  currency: string;
  amountRequestedMinor: number;
  amountFundedMinor: number;
  amountRemainingMinor: number;
  deadline: string | null;
  displayName: string | null;
};

export default async function PublicRequestPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await serverGet<{ request: PublicRequest }>(`/public/requests/${id}`);
  if (!data) notFound();
  const r = data.request;
  const h = t.helpRequests;
  const names = new Intl.DisplayNames([locale], { type: 'region' });
  const money = (minor: number) => formatMoney(minor, r.currency, locale);
  return (
    <article className="narrow">
      <p><a href={`/${locale}/requests`}>← {h.backToList}</a></p>
      <h1>{r.title}</h1>
      <p className="hint">
        {h.categories[r.category]} · {names.of(r.countryCode) ?? r.countryName} · {r.displayName ? h.by.replace('{name}', r.displayName) : h.anonymous}
      </p>
      <p style={{ whiteSpace: 'pre-wrap' }}>{r.summary}</p>
      <div className="card">
        <p className="stat">{h.remaining.replace('{amount}', money(r.amountRemainingMinor))}</p>
        <p>{h.raised.replace('{funded}', money(r.amountFundedMinor)).replace('{total}', money(r.amountRequestedMinor))}</p>
        <progress max={r.amountRequestedMinor} value={r.amountFundedMinor} aria-hidden="true" style={{ width: '100%' }} />
        {r.deadline && <p>{h.deadlineLabel.replace('{date}', new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(r.deadline)))}</p>}
      </div>
      <div className="notice notice-warning">{h.donationsClosed}</div>
      <p><a href={`/${locale}/report-abuse?url=${encodeURIComponent(`/${locale}/requests/${r.id}`)}`}>{h.report}</a></p>
    </article>
  );
}
