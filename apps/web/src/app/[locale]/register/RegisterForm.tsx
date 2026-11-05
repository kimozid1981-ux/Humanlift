'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { api, fieldErrors } from '@/lib/api';
import { Alert, Field } from '@/components/Field';
import type { Dictionary } from '@/i18n/en';

type T = Pick<Dictionary, 'auth' | 'common'>;

export function RegisterForm({ locale, countries, t }: { locale: string; countries: { code: string; label: string }[]; t: T }) {
  const a = t.auth;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const roles = f.getAll('roles');
    const local: Record<string, string> = {};
    if (roles.length === 0) local.roles = 'roles';
    if (!f.get('acceptTerms')) local.acceptTerms = 'acceptTerms';
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    setBusy(true);
    setFormError(null);
    const res = await api('/auth/register', {
      method: 'POST',
      body: {
        email: f.get('email'),
        password: f.get('password'),
        displayName: f.get('displayName'),
        roles,
        locale,
        countryCode: f.get('countryCode') || undefined,
        acceptTerms: true,
      },
    });
    setBusy(false);
    if (res.ok) {
      window.location.href = `/${locale}/account`;
      return;
    }
    if (res.status === 429) return setFormError(t.common.tooMany);
    const fe = fieldErrors(res.data);
    setErrors(fe);
    if (Object.keys(fe).length === 0) setFormError(res.data?.error === 'registration_failed' ? a.registrationFailed : t.common.genericError);
  }

  const err = (k: string, msg?: string) => (errors[k] ? msg ?? (a.errors as Record<string, string>)[errors[k]] ?? a.errors[k as keyof typeof a.errors] : undefined);

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      {formError && <Alert kind="error">{formError}</Alert>}
      <Field label={a.email} name="email" type="email" required autoComplete="email" error={err('email', a.errors.email)} />
      <Field label={a.password} name="password" type="password" required autoComplete="new-password" hint={a.passwordHint} error={err('password')} />
      <Field label={a.displayName} name="displayName" required autoComplete="nickname" hint={a.displayNameHint} error={err('displayName', a.errors.displayName)} />
      <Field label={`${a.country} (${t.common.optional})`} name="countryCode" defaultValue="">
        <option value="">{a.countryNone}</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>{c.label}</option>
        ))}
      </Field>
      <fieldset aria-describedby={errors.roles ? 'roles-err' : undefined}>
        <legend>{a.rolesLegend}</legend>
        {errors.roles && <p id="roles-err" className="error-text">{a.errors.roles}</p>}
        <label className="check"><input type="checkbox" name="roles" value="APPLICANT" /> {a.roleApplicant}</label>
        <label className="check"><input type="checkbox" name="roles" value="DONOR" /> {a.roleDonor}</label>
      </fieldset>
      <div>
        {errors.acceptTerms && <p id="terms-err" className="error-text">{a.errors.acceptTerms}</p>}
        <label className="check">
          <input type="checkbox" name="acceptTerms" aria-describedby={errors.acceptTerms ? 'terms-err' : undefined} aria-invalid={errors.acceptTerms ? true : undefined} />
          <span>
            {a.acceptTerms} <Link href={`/${locale}/terms`}>↗</Link>
          </span>
        </label>
      </div>
      <div>
        <button className="btn" type="submit" disabled={busy}>{busy ? t.common.loading : a.registerButton}</button>
      </div>
      <p>
        {a.haveAccount} <Link href={`/${locale}/login`}>{a.loginButton}</Link>
      </p>
    </form>
  );
}
