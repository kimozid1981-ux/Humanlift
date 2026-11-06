'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/i18n/config';
import { RequestForm, RequestT } from '@/components/RequestForm';

type Item = { id: string; title: string; status: string; amountRequestedMinor: number; currency: string; createdAt: string };

export function MyRequestsApp({ locale, t }: { locale: string; t: RequestT }) {
  const h = t.helpRequests;
  const [roles, setRoles] = useState<string[] | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  const load = useCallback(async () => {
    const me = await api<{ user: { roles: string[] } }>('/auth/me');
    if (me.status === 401) {
      window.location.href = `/${locale}/login`;
      return;
    }
    if (me.ok) setRoles(me.data.user.roles);
    const r = await api<{ items: Item[] }>('/me/requests');
    if (r.ok) setItems(r.data.items);
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  if (!roles) return <p role="status">{t.common.loading}</p>;

  return (
    <>
      <h1>{h.myTitle}</h1>
      <p>{h.myIntro}</p>
      <div className="notice notice-warning">{h.donationsClosed}</div>

      <section className="account-section" aria-labelledby="mine-h">
        <h2 id="mine-h">{h.myTitle}</h2>
        {items.length === 0 ? (
          <p>{h.noneYet}</p>
        ) : (
          <div className="table-wrap">
            <table data-testid="my-requests">
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td><a href={`/${locale}/account/requests/${r.id}`}>{r.title}</a></td>
                    <td>{formatMoney(r.amountRequestedMinor, r.currency, locale)}</td>
                    <td><span className="badge">{h.statuses[r.status] ?? r.status}</span></td>
                    <td>{formatDate(r.createdAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="account-section" aria-labelledby="new-h">
        <h2 id="new-h">{h.newTitle}</h2>
        {roles.includes('APPLICANT') ? (
          <RequestForm
            locale={locale}
            t={t}
            submitLabel={h.saveDraft}
            onSave={async (body) => {
              const r = await api<{ request: { id: string } }>('/me/requests', { method: 'POST', body });
              if (r.ok) window.location.href = `/${locale}/account/requests/${r.data.request.id}`;
              return r;
            }}
          />
        ) : (
          <>
            <p>{h.needApplicant}</p>
            <p><a className="btn btn-secondary" href={`/${locale}/account`}>{h.openAccount}</a></p>
          </>
        )}
      </section>
    </>
  );
}
