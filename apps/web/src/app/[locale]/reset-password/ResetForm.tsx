'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { api, fieldErrors } from '@/lib/api';
import { Alert, Field } from '@/components/Field';
import type { Dictionary } from '@/i18n/en';

export function ResetForm({ locale, token, t }: { locale: string; token: string; t: Pick<Dictionary, 'auth' | 'common'> }) {
  const a = t.auth;
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'invalid'>('idle');
  const [pwError, setPwError] = useState<string | undefined>();
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('busy');
    const res = await api('/auth/password-reset/confirm', { method: 'POST', body: { token, password: new FormData(e.currentTarget).get('password') } });
    if (res.ok) return setState('done');
    const fe = fieldErrors(res.data);
    if (fe.password) {
      setPwError((a.errors as Record<string, string>)[fe.password] ?? a.errors.password_too_short);
      return setState('idle');
    }
    setState('invalid');
  }
  if (state === 'done') return <Alert kind="success">{a.resetDone} <Link href={`/${locale}/login`}>{a.loginButton}</Link></Alert>;
  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      {state === 'invalid' && <Alert kind="error">{a.invalidToken} <Link href={`/${locale}/forgot-password`}>{a.forgotButton}</Link></Alert>}
      <Field label={a.newPassword} name="password" type="password" required autoComplete="new-password" hint={a.passwordHint} error={pwError} />
      <div><button className="btn" type="submit" disabled={state === 'busy'}>{a.resetButton}</button></div>
    </form>
  );
}
