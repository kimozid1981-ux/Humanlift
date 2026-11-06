import { notFound } from 'next/navigation';
import { LocaleParams, resolveLocale } from '@/lib/page';
import { serverGet } from '@/lib/server-api';
import { formatDate } from '@/i18n/config';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false } };

type Email = { id: string; to: string; subject: string; body: string; createdAt: string };

/** Development only: shows sandbox emails. The API returns 404 outside development/test. */
export default async function OutboxPage({ params }: LocaleParams) {
  const { locale, t } = await resolveLocale(params);
  const data = await serverGet<{ items: Email[] }>('/dev/outbox');
  if (!data) notFound();
  const linkify = (body: string) =>
    body.split(/(https?:\/\/\S+)/g).map((part, i) => (/^https?:\/\//.test(part) ? <a key={i} href={part}>{part}</a> : part));
  return (
    <>
      <h1>{t.dev.outboxTitle}</h1>
      <div className="notice notice-warning">{t.dev.outboxIntro}</div>
      {data.items.length === 0 && <p>{t.dev.empty}</p>}
      {data.items.map((m) => (
        <article key={m.id} className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ marginTop: 0 }}>{m.subject}</h2>
          <p className="hint">{m.to} · {formatDate(m.createdAt, locale)}</p>
          <pre className="email">{linkify(m.body)}</pre>
        </article>
      ))}
    </>
  );
}
