'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/i18n/config';
import { Alert } from '@/components/Field';
import { RequestForm, RequestT, RequestValues } from '@/components/RequestForm';

type Detail = RequestValues & {
  id: string;
  status: string;
  publicConsent: boolean;
  lastDecisionNote: string | null;
  amountFundedMinor: number;
  history: { fromStatus: string | null; toStatus: string; reason: string | null; occurredAt: string }[];
};

const FINAL = ['CLOSED', 'REJECTED', 'CANCELLED', 'PAID_TO_CREDITOR'];
const CANCELLABLE = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'SUSPENDED'];

export function RequestDetailApp({ id, locale, t }: { id: string; locale: string; t: RequestT }) {
  const h = t.helpRequests;
  const [r, setR] = useState<Detail | null>(null);
  const [missing, setMissing] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    const res = await api<{ request: Detail }>(`/me/requests/${id}`);
    if (res.status === 401) {
      window.location.href = `/${locale}/login`;
      return;
    }
    if (res.ok) setR(res.data.request);
    else setMissing(true);
  }, [id, locale]);

  useEffect(() => {
    load();
  }, [load]);

  if (missing) return <Alert kind="error">{t.common.genericError}</Alert>;
  if (!r) return <p role="status">{t.common.loading}</p>;

  async function call(path: string, body: unknown, success: string) {
    const res = await api(`/me/requests/${id}${path}`, { method: 'POST', body });
    if (res.ok) {
      setMsg({ kind: 'success', text: success });
      setConfirming(false);
      await load();
    } else {
      const code = res.data?.error as string | undefined;
      setMsg({ kind: 'error', text: (code && h.errors[code]) || t.common.genericError });
    }
  }

  const closed = FINAL.includes(r.status);

  return (
    <>
      <p><a href={`/${locale}/account/requests`}>← {h.back}</a></p>
      <h1>{r.title}</h1>
      <p>
        <span className="badge" data-testid="request-status">{h.statuses[r.status] ?? r.status}</span>{' '}
        {h.categories[r.category]} · {formatMoney(r.amountRequestedMinor, r.currency, locale)}
      </p>
      <p>{h.statusHelp[r.status]}</p>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      {r.lastDecisionNote && ['DRAFT', 'REJECTED', 'SUSPENDED', 'APPROVED'].includes(r.status) && (
        <div className="notice notice-info" data-testid="decision-note">
          <strong>{h.decisionNote}:</strong> {r.lastDecisionNote}
        </div>
      )}

      {r.status === 'DRAFT' ? (
        <section className="account-section" aria-labelledby="edit-h">
          <h2 id="edit-h">{h.saveChanges}</h2>
          <RequestForm
            locale={locale}
            t={t}
            initial={r}
            submitLabel={h.saveChanges}
            onSave={async (body) => {
              const res = await api(`/me/requests/${id}`, { method: 'PATCH', body });
              if (res.ok) {
                setMsg({ kind: 'success', text: h.saved });
                await load();
              }
              return res;
            }}
          />
          <p style={{ marginTop: '1rem' }}>
            <button type="button" className="btn" onClick={() => call('/submit', undefined, h.submitted)}>{h.submit}</button>
          </p>
        </section>
      ) : (
        <section className="account-section">
          <p style={{ whiteSpace: 'pre-wrap' }}>{r.summary}</p>
        </section>
      )}

      {!closed && (
        <section className="account-section" aria-labelledby="consent-h">
          <h2 id="consent-h">{h.consentTitle}</h2>
          <p>{h.consentText}</p>
          {r.publicConsent ? (
            <>
              <p data-testid="consent-state"><span className="badge badge-ok">✓</span> {h.consentGiven}</p>
              <button type="button" className="btn btn-secondary" onClick={() => call('/consent', { consent: false }, h.saved)}>{h.withdrawConsent}</button>
            </>
          ) : (
            <>
              <p data-testid="consent-state">{h.consentNone}</p>
              <button type="button" className="btn btn-secondary" onClick={() => call('/consent', { consent: true }, h.saved)}>{h.giveConsent}</button>
            </>
          )}
        </section>
      )}

      {CANCELLABLE.includes(r.status) && (
        <section className="account-section" aria-labelledby="cancel-h">
          <h2 id="cancel-h">{h.cancelRequest}</h2>
          <p>{h.cancelExplain}</p>
          {confirming ? (
            <p style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn" onClick={() => call('/cancel', undefined, h.cancelled)}>{h.confirmCancel}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirming(false)}>{h.keep}</button>
            </p>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={() => setConfirming(true)}>{h.cancelRequest}</button>
          )}
        </section>
      )}

      <section className="account-section" aria-labelledby="history-h">
        <h2 id="history-h">{h.history}</h2>
        <ol data-testid="request-history">
          {r.history.map((e, i) => (
            <li key={i}>
              {formatDate(e.occurredAt, locale)}: {h.statuses[e.toStatus] ?? e.toStatus}
              {e.reason ? ` (${e.reason})` : ''}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
