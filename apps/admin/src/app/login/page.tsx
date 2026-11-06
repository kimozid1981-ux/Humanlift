'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const r = await api('/admin/auth/login', { method: 'POST', body: { email: f.get('email'), password: f.get('password') } });
    setBusy(false);
    if (r.ok) window.location.href = '/mfa';
    else setError(r.status === 429 ? 'Too many attempts. Wait a minute.' : r.status === 403 ? 'This account is not active.' : 'Email or password is incorrect.');
  }
  return (
    <main className="center card" id="main">
      <h1>Staff sign-in</h1>
      <form className="stack" onSubmit={onSubmit}>
        {error && <p className="error" role="alert">{error}</p>}
        <div><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required /></div>
        <div><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
        <button type="submit" disabled={busy}>Continue</button>
      </form>
      <p className="muted">A second step with an authenticator app is always required.</p>
    </main>
  );
}
