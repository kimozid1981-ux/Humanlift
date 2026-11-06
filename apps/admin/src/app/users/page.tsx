'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { Shell, useLoad, useStaff, when } from '@/components/Shell';

const ALL_ROLES = ['APPLICANT', 'DONOR', 'VERIFICATION_SPECIALIST', 'COMPLIANCE_SPECIALIST', 'ADMINISTRATOR', 'SUPER_ADMINISTRATOR'];
type U = { id: string; email: string; displayName: string; status: string; roles: string[]; createdAt: string; emailVerifiedAt: string | null; mfaEnabledAt: string | null };

function Users() {
  const staff = useStaff();
  const [q, setQ] = useState('');
  const { data, error, reload } = useLoad<{ items: U[] }>(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  const [msg, setMsg] = useState<string | null>(null);
  const isSuper = staff.roles.includes('SUPER_ADMINISTRATOR');
  const canStatus = isSuper || staff.roles.includes('ADMINISTRATOR');

  async function saveRoles(e: FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    const roles = new FormData(e.currentTarget).getAll('roles');
    const r = await api(`/admin/users/${id}/roles`, { method: 'PUT', body: { roles } });
    setMsg(r.ok ? 'Roles updated and recorded in the audit log.' : `Refused: ${r.data?.error ?? r.status}`);
    reload();
  }
  async function setStatus(id: string, status: string) {
    const reason = window.prompt(`Reason for setting status to ${status} (recorded in the audit log):`);
    if (!reason) return;
    const r = await api(`/admin/users/${id}/status`, { method: 'PATCH', body: { status, reason } });
    setMsg(r.ok ? `Status set to ${status}.` : `Refused: ${r.data?.error ?? r.status}`);
    reload();
  }

  return (
    <>
      <h1>Users and roles</h1>
      <form className="row" onSubmit={(e) => { e.preventDefault(); setQ(String(new FormData(e.currentTarget).get('q') ?? '')); }}>
        <label htmlFor="q" className="sr">Search</label>
        <input id="q" name="q" placeholder="Email or name" style={{ maxWidth: '20rem' }} />
        <button type="submit">Search</button>
      </form>
      {msg && <p className="ok" role="status">{msg}</p>}
      {error && <p className="error">{error}</p>}
      <div className="table-wrap card">
        <table>
          <thead><tr><th>User</th><th>Status</th><th>Roles</th><th>Created</th>{canStatus && <th>Actions</th>}</tr></thead>
          <tbody>
            {data?.items.map((u) => (
              <tr key={u.id}>
                <td>{u.displayName}<br /><span className="muted">{u.email}</span><br />{u.emailVerifiedAt ? 'email confirmed' : 'email not confirmed'}{u.mfaEnabledAt ? ' · MFA on' : ''}</td>
                <td>{u.status}</td>
                <td>
                  {isSuper && u.email !== staff.email ? (
                    <form onSubmit={(e) => saveRoles(e, u.id)} aria-label={`Roles for ${u.email}`}>
                      {ALL_ROLES.map((r) => (
                        <label key={r} style={{ fontWeight: 400 }}><input type="checkbox" name="roles" value={r} defaultChecked={u.roles.includes(r)} style={{ width: 'auto' }} /> {r}</label>
                      ))}
                      <button type="submit" className="secondary">Save roles</button>
                    </form>
                  ) : (
                    u.roles.map((r) => <span key={r} className="badge">{r}</span>)
                  )}
                </td>
                <td>{when(u.createdAt)}</td>
                {canStatus && (
                  <td>
                    {u.email !== staff.email && (u.status === 'ACTIVE'
                      ? <button type="button" className="secondary" onClick={() => setStatus(u.id, 'SUSPENDED')}>Suspend</button>
                      : <button type="button" className="secondary" onClick={() => setStatus(u.id, 'ACTIVE')}>Reactivate</button>)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function Page() {
  return <Shell><Users /></Shell>;
}
