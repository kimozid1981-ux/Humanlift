'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Labels = { signIn: string; register: string; account: string; signOut: string };

export function AuthNav({ locale, labels }: { locale: string; labels: Labels }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    api('/auth/me').then((r) => setSignedIn(r.ok));
  }, []);

  async function signOut() {
    await api('/auth/logout', { method: 'POST' });
    window.location.href = `/${locale}`;
  }

  if (signedIn === null) return <span aria-hidden="true" style={{ minWidth: '10rem' }} />;
  if (signedIn) {
    return (
      <>
        <Link className="btn btn-secondary" href={`/${locale}/account`}>{labels.account}</Link>
        <button type="button" className="btn-link" onClick={signOut}>{labels.signOut}</button>
      </>
    );
  }
  return (
    <>
      <Link href={`/${locale}/login`}>{labels.signIn}</Link>
      <Link className="btn" href={`/${locale}/register`}>{labels.register}</Link>
    </>
  );
}
