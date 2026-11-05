'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { Shell, useLoad, useStaff, when } from '@/components/Shell';

const STATUSES = ['NOT_RESEARCHED', 'RESEARCH_IN_PROGRESS', 'LEGAL_REVIEW_REQUIRED', 'PAYMENT_REVIEW_REQUIRED', 'APPROVED_FOR_BETA', 'APPROVED_FOR_LAUNCH', 'SUSPENDED'];
type C = {
  code: string; name: string; availability: string; languages: string[]; currencies: string[]; complianceOwner: string | null;
  legalSignOffBy: string | null; legalSignOffRef: string | null; legalSignOffAt: string | null;
  paymentSignOffBy: string | null; paymentSignOffRef: string | null; paymentSignOffAt: string | null;
  notes: string | null; lastReviewedAt: string | null;
};

function Countries() {
  const staff = useStaff();
  const canEdit = staff.roles.some((r) => r === 'COMPLIANCE_SPECIALIST' || r === 'SUPER_ADMINISTRATOR');
  const { data, error, reload } = useLoad<{ items: C[] }>('/admin/countries');
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: FormEvent<HTMLFormElement>, code: string) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => (String(f.get(k) ?? '').trim() || null);
    const r = await api(`/admin/countries/${code}`, {
      method: 'PATCH',
      body: {
        availability: f.get('availability'), complianceOwner: v('complianceOwner'), notes: v('notes'),
        legalSignOffBy: v('legalSignOffBy'), legalSignOffRef: v('legalSignOffRef'),
        paymentSignOffBy: v('paymentSignOffBy'), paymentSignOffRef: v('paymentSignOffRef'),
      },
    });
    setMsg(r.ok ? { ok: true, text: `${code} saved.` } : { ok: false, text: r.data?.message ?? `Refused (${r.data?.error ?? r.status}).` });
    if (r.ok) reload();
  }

  return (
    <>
      <h1>Country configuration</h1>
      <p className="muted">A country can only be approved for beta or launch with a recorded legal sign-off and payment sign-off (name and document reference). This is enforced by the server and the database.</p>
      {msg && <p className={msg.ok ? 'ok' : 'error'} role={msg.ok ? 'status' : 'alert'}>{msg.text}</p>}
      {error && <p className="error">{error}</p>}
      {data?.items.map((c) => (
        <div className="card" key={c.code}>
          <div className="row">
            <strong>{c.name} ({c.code})</strong>
            <span className="badge" data-testid={`status-${c.code}`}>{c.availability}</span>
            <span className="muted">{c.languages.join(', ')} · {c.currencies.join(', ')}</span>
            {c.lastReviewedAt && <span className="muted">Reviewed {when(c.lastReviewedAt)}</span>}
            {canEdit && <button type="button" className="secondary" onClick={() => setOpen(open === c.code ? null : c.code)} aria-expanded={open === c.code}>Edit {c.code}</button>}
          </div>
          {open === c.code && (
            <form className="stack" onSubmit={(e) => save(e, c.code)} style={{ marginTop: '1rem' }}>
              <div><label htmlFor={`a-${c.code}`}>Availability</label>
                <select id={`a-${c.code}`} name="availability" defaultValue={c.availability}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label htmlFor={`o-${c.code}`}>Compliance owner</label><input id={`o-${c.code}`} name="complianceOwner" defaultValue={c.complianceOwner ?? ''} /></div>
              <div><label htmlFor={`lb-${c.code}`}>Legal sign-off by</label><input id={`lb-${c.code}`} name="legalSignOffBy" defaultValue={c.legalSignOffBy ?? ''} /></div>
              <div><label htmlFor={`lr-${c.code}`}>Legal sign-off document reference</label><input id={`lr-${c.code}`} name="legalSignOffRef" defaultValue={c.legalSignOffRef ?? ''} /></div>
              <div><label htmlFor={`pb-${c.code}`}>Payment sign-off by</label><input id={`pb-${c.code}`} name="paymentSignOffBy" defaultValue={c.paymentSignOffBy ?? ''} /></div>
              <div><label htmlFor={`pr-${c.code}`}>Payment sign-off document reference</label><input id={`pr-${c.code}`} name="paymentSignOffRef" defaultValue={c.paymentSignOffRef ?? ''} /></div>
              <div><label htmlFor={`n-${c.code}`}>Notes</label><textarea id={`n-${c.code}`} name="notes" defaultValue={c.notes ?? ''} rows={3} /></div>
              <button type="submit">Save {c.code}</button>
            </form>
          )}
        </div>
      ))}
    </>
  );
}

export default function Page() {
  return <Shell><Countries /></Shell>;
}
