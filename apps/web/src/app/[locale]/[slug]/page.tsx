import { notFound } from 'next/navigation';
import { ENABLED_LOCALES, isLocale } from '@/i18n/config';
import { CONTENT_SLUGS, getDictionary } from '@/i18n/dictionaries';
import { alternates } from '@/lib/page';

type Params = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return ENABLED_LOCALES.flatMap((locale) => CONTENT_SLUGS.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: Params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const page = getDictionary(locale).pages[slug];
  return page ? { title: page.title, description: page.description, alternates: alternates(slug) } : {};
}

export default async function ContentPage({ params }: Params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const page = t.pages[slug];
  if (!page) notFound();
  return (
    <article className="narrow">
      <h1>{page.title}</h1>
      <p className="hint">{page.description}</p>
      {page.legalDraft && (
        <div className="notice notice-warning" role="note">
          {t.common.draftNotice}
        </div>
      )}
      {page.sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          {s.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
