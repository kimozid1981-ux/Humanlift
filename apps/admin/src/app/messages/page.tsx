'use client';

import { api } from '@/lib/api';
import { Shell, useLoad, when } from '@/components/Shell';

type M = { id: string; name: string; email: string; topic: string; message: string; locale: string; status: string; createdAt: string };

function Messages() {
  const { data, error, reload } = useLoad<{ items: M[] }>('/admin/contact-messages');
  async function setStatus(id: string, status: string) {
    await api(`/admin/contact-messages/${id}`, { method: 'PATCH', body: { status } });
    reload();
  }
  return (
    <>
      <h1>Contact messages</h1>
      {error && <p className="error">{error}</p>}
      <div className="table-wrap card">
        <table>
          <thead><tr><th>Received</th><th>From</th><th>Topic</th><th>Message</th><th>Status</th></tr></thead>
          <tbody>
            {data?.items.length === 0 && <tr><td colSpan={5}>No messages.</td></tr>}
            {data?.items.map((m) => (
              <tr key={m.id}>
                <td>{when(m.createdAt)}</td>
                <td>{m.name}<br /><span className="muted">{m.email} · {m.locale}</span></td>
                <td>{m.topic}</td>
                <td><pre>{m.message}</pre></td>
                <td>
                  <label htmlFor={`m-${m.id}`} className="muted">Status</label>
                  <select id={`m-${m.id}`} value={m.status} onChange={(e) => setStatus(m.id, e.target.value)}>
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
  return <Shell><Messages /></Shell>;
}
