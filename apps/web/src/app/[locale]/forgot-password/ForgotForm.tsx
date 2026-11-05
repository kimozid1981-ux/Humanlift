'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { Alert, Field } from '@/components/Field';
import type { Dictionary } from '@/i18n/en';

export function ForgotForm({ t }: { t: Pick<Dictionary, 'auth' | 'common'> }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'invalid' | 'limited'>('idle');
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('busy');
    const res = await api('/auth/password-reset/request', { method: 'POST', body: { email: new FormData(e.currentTarget).get('email') } });
    setState(res.ok ? 'done' : res.status === 429 ? 'limited' : 'invalid');
  }
  if (state === 'done') return <Alert kind="success">{t.auth.forgotDone}</Alert>;
  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      {state === 'limited' && <Alert kind="error">{t.common.tooMany}</Alert>}
      <Field label={t.auth.email} name="email" type="email" required autoComplete="email" error={state === 'invalid' ? t.auth.errors.email : undefined} />
      <div><button className="btn" type="submit" disabled={state === 'busy'}>{t.auth.forgotButton}</button></div>
    </form>
  );
}
