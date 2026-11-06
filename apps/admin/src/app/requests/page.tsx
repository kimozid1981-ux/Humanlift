'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Shell, useLoad, when } from '@/components/Shell';

type Item = { id: string; title: string; status: string; category: string; countryCode: string; countryName: string; countryAvailability: string; amountRequestedMinor: number; currency: string; submittedAt: string | null; createdAt: string };
type Detail = Item & {
  summary: string;
  displayMode: string;
  publicDisplayName: string | null;
  publicConsent: boolean;
  deadline: string | null;
  lastDecisionNote: string | null;
  applicant: { id: string; email: string; displayName: string; emailVerifiedAt: string | null; status: string };
  history: { fromStatus: string | null; toStatus: string; actorId: string | null; reason: string | null; occurredAt: string }[];
  allowedActions: string[];
};

const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'SUSPENDED', 'REJECTED', 'CANCELLED'];
const ACTIONS: Record<string, { label: string; reason: boolean; secondary?: boolean }> = {
  start_review: { label: 'Start review', reason: false },
  approve: { label: 'Approve', reason: false },
  request_changes: { label: 'Send back for changes', reason: true, secondary: true },
  reject: { label: 'Reject', reason: true, secondary: true },
  publish: { label: 'Publish', reason: false },
  suspend: { label: 'Suspend', reason: true, secondary: true },
  reinstate: { label: 'Reinstate', reason: true, secondary: true },
};
const ERRORS: Record<string, string> = {
  reason_required: 'Write a reason first. The applicant will see it.',
  applicant_consent_missing: 'The applicant has not agreed to public visibility.',
  country_not_approved: 'This country is not approved for beta or launch, so nothing can be published there yet.',
  cannot_act_on_own_request: 'You cannot review your own request.',
  invalid_transition: 'This action is not possible in the current status.',
  status_changed_meanwhile: 'Someone else changed this request. It has been reloaded.',
  insufficient_role: 'Your role does not allow this action.',
};
const money = (minor: number, currency: string) => new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(minor / 100);

function DetailPanel({ id, onChanged }: { id: string; onChanged: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const load = () => api<{ request: Detail }>(`/admin/requests/${id}`).then((r) => r.ok && setD(r.data.request));
  useEffect(() => {
    setMsg(null);
    setReason('');
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  if (!d) return <p role="status">Loading…</p>;

  async function act(action: string) {
    const r = await api(`/admin/requests/${id}/actions`, { method: 'POST', body: { action, ...(reason.trim() ? { reason: reason.trim() } : {}) } });
    if (r.ok) {
      setMsg({ ok: true, text: `Done: ${ACTIONS[action].label}.` });
      setReason('');
      onChanged();
    } else {
      setMsg({ ok: false, text: ERRORS[r.data?.error] ?? 'Could not complete the action.' });
    }
    load();
  }

  return (
    <section className="card stack" aria-labelledby="detail-h" data-testid="request-detail">
      <h2 id="detail-h" style={{ marginTop: 0 }}>{d.title}</h2>
      <p><span className="badge" data-testid="detail-status">{d.status}</span> {d.category} · {d.countryName} ({d.countryAvailability}) · {money(d.amountRequestedMinor, d.currency)}</p>
      <pre style={{ fontSize: '0.95rem' }}>{d.summary}</pre>
      <p className="muted">
        Applicant: {d.applicant.displayName} ({d.applicant.email}) · email {d.applicant.emailVerifiedAt ? 'confirmed' : 'NOT confirmed'} · account {d.applicant.status}
        <br />Public display: {d.displayMode === 'ANONYMOUS' ? 'anonymous' : `as "${d.publicDisplayName}"`} · Public consent: {d.publicConsent ? 'given' : 'not given'}
        {d.deadline && <><br />Deadline: {when(d.deadline)}</>}
      </p>
      <p className="muted">Identity, address and invoice verification are not built yet (Milestone 2). Check the request manually and do not publish anything you could not verify.</p>
      {msg && <p className={msg.ok ? 'ok' : 'error'} role={msg.ok ? 'status' : 'alert'}>{msg.text}</p>}
      {d.allowedActions.length > 0 && (
        <>
          <div>
            <label htmlFor="reason">Reason (required to send back, reject, suspend or reinstate; shown to the applicant)</label>
            <textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
          </div>
          <div className="row">
            {d.allowedActions.map((a) => (
              <button key={a} type="button" className={ACTIONS[a]?.secondary ? 'secondary' : undefined} onClick={() => act(a)}>{ACTIONS[a]?.label ?? a}</button>
            ))}
          </div>
        </>
      )}
      <h3>History</h3>
      <ol>
        {d.history.map((h, i) => (
          <li key={i}>{when(h.occurredAt)}: {h.fromStatus ?? 'new'} → {h.toStatus}{h.reason ? ` (${h.reason})` : ''}{h.actorId ? <span className="muted"> · by {h.actorId === d.applicant.id ? 'applicant' : `staff ${h.actorId.slice(0, 8)}`}</span> : null}</li>
        ))}
      </ol>
    </section>
  );
}

function Requests() {
  const [status, setStatus] = useState('SUBMITTED');
  const [selected, setSelected] = useState<string | null>(null);
  const { data, error, reload } = useLoad<{ items: Item[] }>(`/admin/requests${status ? `?status=${status}` : ''}`);
  return (
    <>
      <h1>Help requests</h1>
      <p className="muted">Review requests in order of submission. Nobody can review their own request. Publishing needs the applicant&apos;s consent and a country approved for beta or launch. No money moves at this stage.</p>
      <div className="row card">
        <label htmlFor="status-filter" style={{ margin: 0 }}>Status</label>
        <select id="status-filter" value={status} onChange={(e) => { setStatus(e.target.value); setSelected(null); }}>
          <option value="">All except drafts</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="table-wrap card">
        <table>
          <thead><tr><th>Submitted</th><th>Title</th><th>Country</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {data?.items.length === 0 && <tr><td colSpan={5}>No requests in this status.</td></tr>}
            {data?.items.map((r) => (
              <tr key={r.id} aria-selected={selected === r.id}>
                <td>{r.submittedAt ? when(r.submittedAt) : '—'}</td>
                <td><button type="button" className="secondary" onClick={() => setSelected(r.id)}>{r.title}</button></td>
                <td>{r.countryName}</td>
                <td>{money(r.amountRequestedMinor, r.currency)}</td>
                <td><span className="badge">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <DetailPanel id={selected} onChanged={reload} />}
    </>
  );
}

export default function Page() {
  return <Shell><Requests /></Shell>;
}
