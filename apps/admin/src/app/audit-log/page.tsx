'use client';

import { useState } from 'react';
import { Shell, useLoad, when } from '@/components/Shell';

type E = { id: string; occurredAt: string; actorId: string | null; action: string; targetType: string | null; targetId: string | null; ipAddress: string | null; metadata: unknown };

function AuditLog() {
  const [q, setQ] = useState('');
  const { data, error } = useLoad<{ items: E[] }>(`/admin/audit-log?take=200${q ? `&q=${encodeURIComponent(q)}` : ''}`);
  return (
    <>
      <h1>Audit log</h1>
      <p className="muted">Append-only: entries cannot be edited or deleted, by anyone. Showing the latest 200.</p>
      <form className="row" onSubmit={(e) => { e.preventDefault(); setQ(String(new FormData(e.currentTarget).get('q') ?? '')); }}>
        <label htmlFor="q">Filter by action</label>
        <input id="q" name="q" placeholder="e.g. auth.login" style={{ maxWidth: '20rem' }} />
        <button type="submit">Filter</button>
      </form>
      {error && <p className="error">{error}</p>}
      <div className="table-wrap card">
        <table>
          <thead><tr><th>#</th><th>When</th><th>Action</th><th>Actor</th><th>Target</th><th>Details</th></tr></thead>
          <tbody>
            {data?.items.map((e) => (
              <tr key={e.id}>
                <td>{e.id}</td>
                <td>{when(e.occurredAt)}</td>
                <td><code>{e.action}</code></td>
                <td className="muted">{e.actorId ?? '—'}<br />{e.ipAddress}</td>
                <td className="muted">{e.targetType} {e.targetId}</td>
                <td><pre>{e.metadata ? JSON.stringify(e.metadata) : ''}</pre></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function Page() {
  return <Shell><AuditLog /></Shell>;
}
