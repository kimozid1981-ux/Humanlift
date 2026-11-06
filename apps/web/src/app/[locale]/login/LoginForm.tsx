'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { Alert, Field } from '@/components/Field';
import type { Dictionary } from '@/i18n/en';

export function LoginForm({ locale, t }: { locale: string; t: Pick<Dictionary, 'auth' | 'common'> }) {
  const a = t.auth;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const res = await api('/auth/login', { method: 'POST', body: { email: f.get('email'), password: f.get('password') } });
    setBusy(false);
    if (res.ok) {
      window.location.href = `/${locale}/account`;
      return;
    }
    if (res.status === 429) setError(t.common.tooMany);
    else if (res.status === 403) setError(a.accountNotActive);
    else if (res.status === 401 || res.status === 400) setError(a.invalidCredentials);
    else setError(t.common.genericError);
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      {error && <Alert kind="error">{error}</Alert>}
      <Field label={a.email} name="email" type="email" required autoComplete="email" />
      <Field label={a.password} name="password" type="password" required autoComplete="current-password" />
      <div>
        <button className="btn" type="submit" disabled={busy}>{busy ? t.common.loading : a.loginButton}</button>
      </div>
      <p><Link href={`/${locale}/forgot-password`}>{a.forgot}</Link></p>
      <p>{a.noAccount} <Link href={`/${locale}/register`}>{a.registerButton}</Link></p>
    </form>
  );
}
