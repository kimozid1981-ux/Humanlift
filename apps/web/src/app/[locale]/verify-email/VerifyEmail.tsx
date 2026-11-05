'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Alert } from '@/components/Field';
import type { Dictionary } from '@/i18n/en';

/** Confirmation needs a click, so email scanners that pre-open links cannot confirm an address by accident. */
export function VerifyEmail({ locale, token, t }: { locale: string; token: string; t: Pick<Dictionary, 'auth' | 'account'> }) {
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'bad'>('idle');
  async function confirm() {
    setState('busy');
    const res = await api('/auth/verify-email', { method: 'POST', body: { token } });
    setState(res.ok ? 'ok' : 'bad');
  }
  if (state === 'ok') return <Alert kind="success">{t.auth.verified} <Link href={`/${locale}/account`}>{t.account.title}</Link></Alert>;
  if (state === 'bad' || !token) return <Alert kind="error">{t.auth.invalidToken}</Alert>;
  return (
    <button className="btn" type="button" onClick={confirm} disabled={state === 'busy'}>
      {state === 'busy' ? t.auth.verifying : t.auth.verifyTitle}
    </button>
  );
}
