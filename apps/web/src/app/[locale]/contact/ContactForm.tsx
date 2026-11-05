'use client';

import { FormEvent, useState } from 'react';
import { api, fieldErrors } from '@/lib/api';
import { Alert, Field, Honeypot } from '@/components/Field';
import type { Dictionary } from '@/i18n/en';

type T = Pick<Dictionary, 'contact' | 'auth' | 'common'>;

export function ContactForm({ locale, t }: { locale: string; t: T }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error' | 'limited'>('idle');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setStatus('sending');
    const res = await api('/public/contact', {
      method: 'POST',
      body: { name: f.get('name'), email: f.get('email'), topic: f.get('topic'), message: f.get('message'), locale, website: f.get('website') || undefined },
    });
    if (res.ok) return setStatus('done');
    if (res.status === 429) return setStatus('limited');
    setErrors(fieldErrors(res.data));
    setStatus('error');
  }

  if (status === 'done') return <Alert kind="success">{t.contact.done}</Alert>;
  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      {status === 'error' && Object.keys(errors).length === 0 && <Alert kind="error">{t.common.genericError}</Alert>}
      {status === 'limited' && <Alert kind="error">{t.common.tooMany}</Alert>}
      <Field label={t.contact.name} name="name" required autoComplete="name" error={errors.name ? t.auth.errors.displayName : undefined} />
      <Field label={t.auth.email} name="email" type="email" required autoComplete="email" error={errors.email ? t.auth.errors.email : undefined} />
      <Field label={t.contact.topic} name="topic" required defaultValue="general">
        {Object.entries(t.contact.topics).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </Field>
      <Field label={t.contact.message} name="message" multiline required hint={t.contact.messageHint} error={errors.message ? t.contact.messageHint : undefined} />
      <Honeypot />
      <div>
        <button className="btn" type="submit" disabled={status === 'sending'}>{status === 'sending' ? t.common.loading : t.common.submit}</button>
      </div>
    </form>
  );
}
