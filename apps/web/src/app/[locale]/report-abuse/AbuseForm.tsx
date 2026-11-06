'use client';

import { FormEvent, useState } from 'react';
import { api, fieldErrors } from '@/lib/api';
import { Alert, Field, Honeypot } from '@/components/Field';
import type { Dictionary } from '@/i18n/en';

type T = Pick<Dictionary, 'abuse' | 'auth' | 'common' | 'contact'>;

export function AbuseForm({ t, targetUrl }: { t: T; targetUrl?: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error' | 'limited'>('idle');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const optional = (k: string) => (String(f.get(k) ?? '').trim() || undefined);
    setStatus('sending');
    const res = await api('/public/abuse-reports', {
      method: 'POST',
      body: { category: f.get('category'), targetUrl: optional('targetUrl'), description: f.get('description'), reporterEmail: optional('reporterEmail'), website: optional('website') },
    });
    if (res.ok) return setStatus('done');
    if (res.status === 429) return setStatus('limited');
    setErrors(fieldErrors(res.data));
    setStatus('error');
  }

  if (status === 'done') return <Alert kind="success">{t.abuse.done}</Alert>;
  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      {status === 'error' && Object.keys(errors).length === 0 && <Alert kind="error">{t.common.genericError}</Alert>}
      {status === 'limited' && <Alert kind="error">{t.common.tooMany}</Alert>}
      <Field label={t.abuse.category} name="category" required defaultValue="fraud">
        {Object.entries(t.abuse.categories).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </Field>
      <Field label={`${t.abuse.link} (${t.common.optional})`} name="targetUrl" type="url" inputMode="url" defaultValue={targetUrl} />
      <Field label={t.abuse.description} name="description" multiline required hint={t.contact.messageHint} error={errors.description ? t.contact.messageHint : undefined} />
      <Field label={`${t.abuse.email} (${t.common.optional})`} name="reporterEmail" type="email" autoComplete="email" error={errors.reporterEmail ? t.auth.errors.email : undefined} />
      <Honeypot />
      <div>
        <button className="btn" type="submit" disabled={status === 'sending'}>{status === 'sending' ? t.common.loading : t.common.submit}</button>
      </div>
    </form>
  );
}
