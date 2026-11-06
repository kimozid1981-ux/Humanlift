'use client';

import { FormEvent } from 'react';
import { api } from '@/lib/api';
import { Shell, useLoad, when } from '@/components/Shell';

type D = { id: string; type: string; status: string; details: string | null; resolution: string | null; createdAt: string; user: { email: string; displayName: string }; handledBy: { email: string } | null };

function DataRequests() {
  const { data, error, reload } = useLoad<{ items: D[] }>('/admin/data-requests');
  async function update(e: FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await api(`/admin/data-requests/${id}`, { method: 'PATCH', body: { status: f.get('status'), resolution: f.get('resolution') || undefined } });
    reload();
  }
  return (
    <>
      <h1>Data protection requests</h1>
      <p className="muted">Access, correction and deletion requests from users. Legal response deadlines depend on the jurisdiction (under the GDPR, generally one month) and must be confirmed with counsel.</p>
      {error && <p className="error">{error}</p>}
      <div className="table-wrap card">
        <table>
          <thead><tr><th>Received</th><th>User</th><th>Type</th><th>Details</th><th>Decision</th></tr></thead>
          <tbody>
            {data?.items.length === 0 && <tr><td colSpan={5}>No requests.</td></tr>}
            {data?.items.map((d) => (
              <tr key={d.id}>
                <td>{when(d.createdAt)}</td>
                <td>{d.user.displayName}<br /><span className="muted">{d.user.email}</span></td>
                <td>{d.type}</td>
                <td><pre>{d.details ?? '—'}</pre></td>
                <td>
                  <form className="stack" onSubmit={(e) => update(e, d.id)} aria-label={`Update request from ${d.user.email}`}>
                    <select name="status" defaultValue={d.status} aria-label="Status">
                      <option>RECEIVED</option><option>IN_PROGRESS</option><option>COMPLETED</option><option>REJECTED</option>
                    </select>
                    <textarea name="resolution" aria-label="Resolution note shown to the user" defaultValue={d.resolution ?? ''} rows={2} />
                    <button type="submit" className="secondary">Save</button>
                    {d.handledBy && <span className="muted">Handled by {d.handledBy.email}</span>}
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function Page() {
  return <Shell><DataRequests /></Shell>;
}
