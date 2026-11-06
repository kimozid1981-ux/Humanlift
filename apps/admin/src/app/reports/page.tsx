'use client';

import { api } from '@/lib/api';
import { Shell, useLoad, when } from '@/components/Shell';

type R = { id: string; category: string; targetUrl: string | null; description: string; reporterEmail: string | null; status: string; createdAt: string };

function Reports() {
  const { data, error, reload } = useLoad<{ items: R[] }>('/admin/abuse-reports');
  async function setStatus(id: string, status: string) {
    await api(`/admin/abuse-reports/${id}`, { method: 'PATCH', body: { status } });
    reload();
  }
  return (
    <>
      <h1>Abuse reports</h1>
      <p className="muted">Reports are allegations, not findings. Investigate privately; never label a person as fraudulent on a report alone.</p>
      {error && <p className="error">{error}</p>}
      <div className="table-wrap card">
        <table>
          <thead><tr><th>Received</th><th>Category</th><th>Description</th><th>Status</th></tr></thead>
          <tbody>
            {data?.items.length === 0 && <tr><td colSpan={4}>No reports.</td></tr>}
            {data?.items.map((r) => (
              <tr key={r.id}>
                <td>{when(r.createdAt)}</td>
                <td>{r.category}{r.targetUrl && <><br /><span className="muted">{r.targetUrl}</span></>}</td>
                <td><pre>{r.description}</pre>{r.reporterEmail && <span className="muted">From: {r.reporterEmail}</span>}</td>
                <td>
                  <label htmlFor={`s-${r.id}`} className="muted">Status</label>
                  <select id={`s-${r.id}`} value={r.status} onChange={(e) => setStatus(r.id, e.target.value)}>
                    <option>OPEN</option><option>IN_REVIEW</option><option>CLOSED</option>
                  </select>
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
  return <Shell><Reports /></Shell>;
}
