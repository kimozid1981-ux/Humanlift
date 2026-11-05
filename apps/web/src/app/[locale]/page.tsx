import Link from 'next/link';
import { alternates, LocaleParams, resolveLocale } from '@/lib/page';

export async function generateMetadata() {
  return { alternates: alternates('') };
}

export default async function Home({ params }: LocaleParams) {
  const { locale, t } = await resolveLocale(params);
  const h = t.home;
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">{h.title}</h1>
        <p>{h.intro}</p>
        <div className="actions">
          <Link className="btn" href={`/${locale}/applicants`}>{h.ctaApplicant}</Link>
          <Link className="btn btn-secondary" href={`/${locale}/donors`}>{h.ctaDonor}</Link>
        </div>
      </section>

      <section aria-labelledby="steps-title">
        <h2 id="steps-title">{h.stepsTitle}</h2>
        <ol className="grid steps">
          {h.steps.map((s) => (
            <li key={s.title} className="card">
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="principles-title">
        <h2 id="principles-title">{h.principlesTitle}</h2>
        <ul>
          {h.principles.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="status-title" className="notice notice-info">
        <h2 id="status-title" style={{ marginTop: 0 }}>{h.statusTitle}</h2>
        <p style={{ marginBottom: 0 }}>{h.status}</p>
      </section>
    </>
  );
}
