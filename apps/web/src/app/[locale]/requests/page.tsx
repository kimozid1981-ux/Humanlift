import { alternates, LocaleParams, resolveLocale } from '@/lib/page';
import { serverGet } from '@/lib/server-api';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';
export const metadata = { alternates: alternates('requests') };

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
};
type Country = { code: string; name: string; availability: string };

const CATEGORIES = ['HOUSING', 'ENERGY', 'WATER', 'FOOD', 'EDUCATION', 'TRANSPORT', 'FAMILY_EMERGENCY', 'OTHER'];

/** Published requests only. Never sample data: when nothing is published, an honest empty state. */
export default async function RequestsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { locale, t } = await resolveLocale(params);
  const h = t.helpRequests;
  const sp = await searchParams;
  const country = /^[A-Z]{2}$/.test(sp.country ?? '') ? sp.country : undefined;
  const category = CATEGORIES.includes(sp.category ?? '') ? sp.category : undefined;
  const qs = new URLSearchParams({ ...(country ? { country } : {}), ...(category ? { category } : {}) }).toString();
  const [data, countries] = await Promise.all([
    serverGet<{ items: PublicRequest[] }>(`/public/requests${qs ? `?${qs}` : ''}`),
    serverGet<{ items: Country[] }>('/public/countries'),
  ]);
  const names = new Intl.DisplayNames([locale], { type: 'region' });
  const open = (countries?.items ?? []).filter((c) => ['APPROVED_FOR_BETA', 'APPROVED_FOR_LAUNCH'].includes(c.availability) && c.code !== 'ZZ');
  const filtered = Boolean(country || category);
  const items = data?.items ?? [];

  return (
    <>
      <h1>{t.requests.title}</h1>
      <p>{t.requests.intro}</p>
      <div className="notice notice-warning">{h.donationsClosed}</div>
      {open.length > 0 && (
        <form method="get" className="stack" style={{ maxWidth: 'none', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))', alignItems: 'end' }}>
          <div className="field">
            <label htmlFor="f-country">{h.filterCountry}</label>
            <select id="f-country" name="country" defaultValue={country ?? ''}>
              <option value="">{h.all}</option>
              {open.map((c) => <option key={c.code} value={c.code}>{names.of(c.code) ?? c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-category">{h.filterCategory}</label>
            <select id="f-category" name="category" defaultValue={category ?? ''}>
              <option value="">{h.all}</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{h.categories[c]}</option>)}
            </select>
          </div>
          <div><button className="btn" type="submit">{h.filter}</button></div>
        </form>
      )}
      {data === null ? (
        <div className="notice notice-error" role="alert">{t.common.genericError}</div>
      ) : items.length === 0 ? (
        <div className="notice notice-info" role="status">{filtered ? h.noMatch : t.requests.empty}</div>
      ) : (
        <ul className="grid" style={{ listStyle: 'none', padding: 0 }} data-testid="public-requests">
          {items.map((r) => (
            <li key={r.id} className="card">
              <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}><a href={`/${locale}/requests/${r.id}`}>{r.title}</a></h2>
              <p className="hint">{h.categories[r.category]} · {names.of(r.countryCode) ?? r.countryName}</p>
              <p>{h.remaining.replace('{amount}', formatMoney(r.amountRemainingMinor, r.currency, locale))}</p>
              <progress max={r.amountRequestedMinor} value={r.amountFundedMinor} aria-label={h.raised.replace('{funded}', formatMoney(r.amountFundedMinor, r.currency, locale)).replace('{total}', formatMoney(r.amountRequestedMinor, r.currency, locale))} style={{ width: '100%' }} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
