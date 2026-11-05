'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, fieldErrors } from '@/lib/api';
import { Alert, Field } from '@/components/Field';
import { ENABLED_LOCALES, formatDate, LOCALE_NAMES } from '@/i18n/config';
import type { Dictionary } from '@/i18n/en';

type T = Pick<Dictionary, 'account' | 'auth' | 'common'>;
type User = { id: string; email: string; displayName: string; locale: string; countryCode: string | null; emailVerified: boolean; roles: string[] };
type DataRequest = { id: string; type: string; status: string; createdAt: string; resolution?: string | null };

export function AccountApp({ locale, t }: { locale: string; t: T }) {
  const a = t.account;
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string; area: string } | null>(null);

  const load = useCallback(async () => {
    const me = await api<{ user: User }>('/auth/me');
    if (me.status === 401) {
      window.location.href = `/${locale}/login`;
      return;
    }
    if (me.ok) setUser(me.data.user);
    const dr = await api<{ items: DataRequest[] }>('/me/data-requests');
    if (dr.ok) setRequests(dr.data.items);
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  if (!user) return <p role="status">{t.common.loading}</p>;

  const flash = (area: string, kind: 'success' | 'error', text: string) => setMsg({ area, kind, text });
  const show = (area: string) => (msg && msg.area === area ? <Alert kind={msg.kind}>{msg.text}</Alert> : null);

  async function resend() {
    const r = await api('/auth/resend-verification', { method: 'POST' });
    flash('overview', r.ok ? 'success' : 'error', r.ok ? a.resent : r.status === 429 ? t.common.tooMany : t.common.genericError);
  }

  async function addRole(role: 'APPLICANT' | 'DONOR') {
    const r = await api<{ user: User }>('/me/roles', { method: 'POST', body: { role } });
    if (r.ok) setUser(r.data.user);
    else flash('overview', 'error', t.common.genericError);
  }

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const newLocale = String(f.get('locale'));
    const r = await api<{ user: User }>('/me', { method: 'PATCH', body: { displayName: f.get('displayName'), locale: newLocale } });
    if (!r.ok) return flash('profile', 'error', fieldErrors(r.data).displayName ? t.auth.errors.displayName : t.common.genericError);
    setUser(r.data.user);
    if (newLocale !== locale) {
      window.location.href = `/${newLocale}/account`;
      return;
    }
    flash('profile', 'success', t.common.saved);
  }

  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await api('/me/password', { method: 'POST', body: { currentPassword: f.get('currentPassword'), newPassword: f.get('newPassword') } });
    if (r.ok) {
      form.reset();
      return flash('security', 'success', a.passwordChanged);
    }
    const fe = fieldErrors(r.data);
    if (fe.newPassword) return flash('security', 'error', (t.auth.errors as Record<string, string>)[fe.newPassword] ?? t.auth.errors.password_too_short);
    flash('security', 'error', r.data?.error === 'current_password_incorrect' ? a.wrongCurrentPassword : t.common.genericError);
  }

  async function requestData(type: 'ACCESS' | 'CORRECTION' | 'DELETION', details?: string) {
    const r = await api('/me/data-requests', { method: 'POST', body: { type, details: details || undefined } });
    if (r.ok) {
      flash('privacy', 'success', a.requestSent);
      load();
    } else flash('privacy', 'error', r.data?.error === 'request_already_open' ? a.requestAlreadyOpen : t.common.genericError);
  }

  async function download() {
    const r = await api('/me/export');
    if (!r.ok) return flash('privacy', 'error', t.common.genericError);
    const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'humanlift-my-data.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <h1>{a.title}</h1>
      <p>{a.welcome.replace('{name}', user.displayName)}</p>
      <nav aria-label={a.title} className="account-nav">
        <ul>
          <li><a href="#overview">{a.tabs.overview}</a></li>
          <li><a href="#profile">{a.tabs.profile}</a></li>
          <li><a href="#security">{a.tabs.security}</a></li>
          <li><a href="#privacy">{a.tabs.privacy}</a></li>
        </ul>
      </nav>

      <section id="overview" className="account-section" aria-labelledby="overview-h">
        <h2 id="overview-h">{a.tabs.overview}</h2>
        {show('overview')}
        {user.emailVerified ? (
          <p><span className="badge badge-ok">✓ {a.emailVerified}</span></p>
        ) : (
          <div className="notice notice-warning">
            <p>{a.emailNotVerified}</p>
            <button type="button" className="btn btn-secondary" onClick={resend}>{a.resend}</button>
          </div>
        )}
        <h3>{a.rolesTitle}</h3>
        <ul data-testid="roles">{user.roles.map((r) => <li key={r}>{a.roles[r] ?? r}</li>)}</ul>
        {!user.roles.includes('APPLICANT') && <button type="button" className="btn btn-secondary" onClick={() => addRole('APPLICANT')}>{a.addApplicant}</button>}
        {!user.roles.includes('DONOR') && <button type="button" className="btn btn-secondary" onClick={() => addRole('DONOR')}>{a.addDonor}</button>}
        <h3>{a.nextStepsTitle}</h3>
        {user.roles.includes('APPLICANT') && <p>{a.nextApplicant}</p>}
        {user.roles.includes('DONOR') && <p>{a.nextDonor}</p>}
      </section>

      <section id="profile" className="account-section" aria-labelledby="profile-h">
        <h2 id="profile-h">{a.profileTitle}</h2>
        {show('profile')}
        <form className="stack" onSubmit={saveProfile}>
          <p><strong>{t.auth.email}:</strong> {user.email}</p>
          <Field label={t.auth.displayName} name="displayName" required defaultValue={user.displayName} autoComplete="nickname" />
          <Field label={a.language} name="locale" defaultValue={user.locale}>
            {ENABLED_LOCALES.map((l) => <option key={l} value={l}>{LOCALE_NAMES[l]}</option>)}
          </Field>
          <div><button className="btn" type="submit">{t.common.save}</button></div>
        </form>
      </section>

      <section id="security" className="account-section" aria-labelledby="security-h">
        <h2 id="security-h">{a.securityTitle}</h2>
        {show('security')}
        <form className="stack" onSubmit={changePassword}>
          <Field label={a.currentPassword} name="currentPassword" type="password" required autoComplete="current-password" />
          <Field label={t.auth.newPassword} name="newPassword" type="password" required autoComplete="new-password" hint={t.auth.passwordHint} />
          <div><button className="btn" type="submit">{a.changePassword}</button></div>
        </form>
      </section>

      <section id="privacy" className="account-section" aria-labelledby="privacy-h">
        <h2 id="privacy-h">{a.privacyTitle}</h2>
        <p>{a.privacyIntro}</p>
        {show('privacy')}
        <p><button type="button" className="btn" onClick={download}>{a.download}</button></p>
        <p><button type="button" className="btn btn-secondary" onClick={() => requestData('ACCESS')}>{a.requestAccess}</button></p>
        <p><button type="button" className="btn btn-secondary" onClick={() => requestData('CORRECTION')}>{a.requestCorrection}</button></p>
        <div className="notice notice-warning">
          <p>{a.deletionWarning}</p>
          <button type="button" className="btn btn-secondary" onClick={() => requestData('DELETION')}>{a.requestDeletion}</button>
        </div>
        <h3>{a.requestsTitle}</h3>
        {requests.length === 0 ? (
          <p>{a.noRequests}</p>
        ) : (
          <div className="table-wrap">
            <table data-testid="data-requests">
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{a.types[r.type] ?? r.type}</td>
                    <td><span className="badge">{a.statuses[r.status] ?? r.status}</span></td>
                    <td>{formatDate(r.createdAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
