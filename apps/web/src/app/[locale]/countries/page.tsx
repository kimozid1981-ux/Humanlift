import { alternates, LocaleParams, resolveLocale } from '@/lib/page';
import { serverGet } from '@/lib/server-api';

export const dynamic = 'force-dynamic';
export const metadata = { alternates: alternates('countries') };

type Country = { code: string; name: string; availability: string };

export default async function CountriesPage({ params }: LocaleParams) {
  const { locale, t } = await resolveLocale(params);
  const data = await serverGet<{ items: Country[] }>('/public/countries');
  const names = new Intl.DisplayNames([locale], { type: 'region' });
  const items = (data?.items ?? []).map((c) => ({ ...c, label: names.of(c.code) ?? c.name })).sort((a, b) => a.label.localeCompare(b.label, locale));
  return (
    <>
      <h1>{t.countries.title}</h1>
      <p>{t.countries.intro}</p>
      {data === null ? (
        <div className="notice notice-error" role="alert">{t.common.genericError}</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th scope="col">{t.countries.country}</th><th scope="col">{t.countries.status}</th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.code}>
                  <td>{c.label}</td>
                  <td><span className="badge">{t.countries.statuses[c.availability] ?? c.availability}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
