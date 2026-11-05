'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export type StaffSession = { email: string; displayName: string; roles: string[]; mfaEnabled: boolean; mfaVerified: boolean };
const Ctx = createContext<StaffSession | null>(null);
export const useStaff = () => useContext(Ctx)!;

const NAV: { href: string; label: string; roles: string[] }[] = [
  { href: '/', label: 'Overview', roles: [] },
  { href: '/users', label: 'Users and roles', roles: ['ADMINISTRATOR', 'SUPER_ADMINISTRATOR', 'COMPLIANCE_SPECIALIST'] },
  { href: '/reports', label: 'Abuse reports', roles: ['VERIFICATION_SPECIALIST', 'COMPLIANCE_SPECIALIST', 'ADMINISTRATOR', 'SUPER_ADMINISTRATOR'] },
  { href: '/messages', label: 'Contact messages', roles: ['ADMINISTRATOR', 'SUPER_ADMINISTRATOR', 'COMPLIANCE_SPECIALIST'] },
  { href: '/data-requests', label: 'Data requests', roles: ['COMPLIANCE_SPECIALIST', 'ADMINISTRATOR', 'SUPER_ADMINISTRATOR'] },
  { href: '/countries', label: 'Countries', roles: ['COMPLIANCE_SPECIALIST', 'ADMINISTRATOR', 'SUPER_ADMINISTRATOR'] },
  { href: '/audit-log', label: 'Audit log', roles: ['COMPLIANCE_SPECIALIST', 'ADMINISTRATOR', 'SUPER_ADMINISTRATOR'] },
];

/** Every admin page sits inside this shell: it requires a staff session with MFA completed. */
export function Shell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StaffSession | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    api<StaffSession>('/admin/auth/session').then((r) => {
      if (!r.ok) window.location.href = '/login';
      else if (!r.data.mfaVerified) window.location.href = '/mfa';
      else setSession(r.data);
    });
  }, []);

  if (!session) return <p className="content" role="status">Checking your session…</p>;

  async function signOut() {
    await api('/admin/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const visible = NAV.filter((n) => n.roles.length === 0 || n.roles.some((r) => session.roles.includes(r)));
  return (
    <Ctx.Provider value={session}>
      <div className="shell">
        <aside className="side">
          <strong>HumanLift Admin</strong>
          <p className="who">{session.displayName}<br />{session.roles.join(', ')}</p>
          <nav aria-label="Admin">
            {visible.map((n) => (
              <Link key={n.href} href={n.href} aria-current={pathname === n.href ? 'page' : undefined}>{n.label}</Link>
            ))}
          </nav>
          <p><button type="button" className="secondary" onClick={signOut}>Sign out</button></p>
        </aside>
        <main className="content" id="main">{children}</main>
      </div>
    </Ctx.Provider>
  );
}

export function useLoad<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = () =>
    api<T>(path).then((r) => {
      if (r.ok) setData(r.data);
      else setError(r.status === 403 ? 'Your role does not allow access to this page.' : 'Could not load data.');
    });
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  return { data, error, reload };
}

export function when(d: string) {
  return new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}
