'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Mfa() {
  const [mode, setMode] = useState<'loading' | 'enrol' | 'verify'>('loading');
  const [qr, setQr] = useState<{ qrCodeDataUrl: string; manualEntryKey: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ mfaEnabled: boolean; mfaVerified: boolean }>('/admin/auth/session').then(async (r) => {
      if (!r.ok) return (window.location.href = '/login');
      if (r.data.mfaVerified) return (window.location.href = '/');
      if (r.data.mfaEnabled) return setMode('verify');
      const e = await api('/admin/auth/mfa/enrol', { method: 'POST' });
      if (e.ok) setQr(e.data);
      setMode('enrol');
    });
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get('code') ?? '').replace(/\s/g, '');
    const r = await api('/admin/auth/mfa/verify', { method: 'POST', body: { code } });
    if (r.ok) window.location.href = '/';
    else setError(r.status === 429 ? 'Too many attempts. Wait a minute.' : 'That code is not valid. Check the time on your phone and try the newest code.');
  }

  if (mode === 'loading') return <p className="center" role="status">Loading…</p>;
  return (
    <main className="center card" id="main">
      <h1>{mode === 'enrol' ? 'Set up your authenticator app' : 'Enter your 6-digit code'}</h1>
      {mode === 'enrol' && qr && (
        <>
          <p>Scan this code with an authenticator app (for example Google Authenticator, Microsoft Authenticator or 1Password). This is required for every staff account.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr.qrCodeDataUrl} alt="QR code for your authenticator app" width={200} height={200} />
          <p>Can’t scan? Enter this key manually:</p>
          <p><code data-testid="manual-key">{qr.manualEntryKey}</code></p>
        </>
      )}
      <form className="stack" onSubmit={onSubmit}>
        {error && <p className="error" role="alert">{error}</p>}
        <div>
          <label htmlFor="code">6-digit code</label>
          <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" required />
        </div>
        <button type="submit">Verify</button>
      </form>
    </main>
  );
}
