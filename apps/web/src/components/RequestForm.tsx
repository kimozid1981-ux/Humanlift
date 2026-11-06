'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, fieldErrors } from '@/lib/api';
import { minorToInput, parseAmountToMinor } from '@/lib/money';
import { Alert, Field } from '@/components/Field';
import type { Dictionary } from '@/i18n/en';

export type RequestT = Pick<Dictionary, 'helpRequests' | 'common'>;
type Country = { code: string; name: string; currencies: string[] };
export type RequestValues = {
  title: string;
  summary: string;
  category: string;
  countryCode: string;
  currency: string;
  amountRequestedMinor: number;
  deadline: string | null;
  displayMode: 'ANONYMOUS' | 'DISPLAY_NAME';
  publicDisplayName: string | null;
};

/** Categories applicants can choose. Healthcare stays off until a data protection impact assessment is done. */
const CATEGORIES = ['HOUSING', 'ENERGY', 'WATER', 'FOOD', 'EDUCATION', 'TRANSPORT', 'FAMILY_EMERGENCY', 'OTHER'];

/** Create or edit form for a request draft. Calls onSaved with the API response on success. */
export function RequestForm({ locale, t, initial, submitLabel, onSave }: {
  locale: string;
  t: RequestT;
  initial?: RequestValues;
  submitLabel: string;
  onSave: (body: Record<string, unknown>) => Promise<{ ok: boolean; status: number; data: any }>;
}) {
  const h = t.helpRequests;
  const [countries, setCountries] = useState<Country[]>([]);
  const [country, setCountry] = useState(initial?.countryCode ?? '');
  const [displayMode, setDisplayMode] = useState(initial?.displayMode ?? 'ANONYMOUS');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ items: Country[] }>('/public/countries').then((r) => {
      if (!r.ok) return;
      const names = new Intl.DisplayNames([locale], { type: 'region' });
      // The automated-test country never appears in real forms.
      const items = r.data.items.filter((c) => c.code !== 'ZZ').map((c) => ({ ...c, name: names.of(c.code) ?? c.name }));
      setCountries(items.sort((a, b) => a.name.localeCompare(b.name, locale)));
      if (!initial) setCountry((current) => current || 'FR');
    });
  }, [locale, initial]);

  const currencies = countries.find((c) => c.code === country)?.currencies ?? [];

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const amount = parseAmountToMinor(String(f.get('amount') ?? ''));
    const local: Record<string, string> = {};
    if (amount === null) local.amount = h.errors.amount;
    if (Object.keys(local).length) {
      setErrors(local);
      setError(h.errors.invalid);
      return;
    }
    const deadline = String(f.get('deadline') ?? '');
    const body = {
      title: f.get('title'),
      summary: f.get('summary'),
      category: f.get('category'),
      countryCode: f.get('countryCode'),
      currency: f.get('currency'),
      amountRequestedMinor: amount,
      deadline: deadline ? deadline : null,
      displayMode: f.get('displayMode'),
      publicDisplayName: displayMode === 'DISPLAY_NAME' ? String(f.get('publicDisplayName') ?? '') || null : null,
    };
    setBusy(true);
    const r = await onSave(body);
    setBusy(false);
    if (r.ok) {
      setErrors({});
      setError(null);
      return;
    }
    const fe = fieldErrors(r.data);
    const mapped: Record<string, string> = {};
    if (fe.title) mapped.title = h.errors.title;
    if (fe.summary) mapped.summary = h.errors.summary;
    if (fe.amountRequestedMinor) mapped.amount = h.errors.amount;
    if (fe.publicDisplayName) mapped.publicDisplayName = h.errors.display_name_required;
    const code = r.data?.error as string | undefined;
    if (code === 'display_name_required') mapped.publicDisplayName = h.errors.display_name_required;
    if (code === 'deadline_out_of_range') mapped.deadline = h.errors.deadline_out_of_range;
    setErrors(mapped);
    setError(r.status === 429 ? t.common.tooMany : (code && h.errors[code]) || (Object.keys(mapped).length ? h.errors.invalid : t.common.genericError));
  }

  return (
    <form className="stack" onSubmit={submit} noValidate data-testid="request-form">
      {error && <Alert kind="error">{error}</Alert>}
      <Field label={h.fields.title} name="title" required hint={h.fields.titleHint} error={errors.title} defaultValue={initial?.title} />
      <Field label={h.fields.summary} name="summary" required multiline hint={h.fields.summaryHint} error={errors.summary} defaultValue={initial?.summary} />
      <Field label={h.fields.category} name="category" required defaultValue={initial?.category ?? 'ENERGY'}>
        {CATEGORIES.map((c) => <option key={c} value={c}>{h.categories[c]}</option>)}
      </Field>
      <div className="field">
        <label htmlFor="req-country">{h.fields.country}</label>
        <select id="req-country" name="countryCode" value={country} onChange={(e) => setCountry(e.target.value)} required>
          {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="req-currency">{h.fields.currency}</label>
        <select id="req-currency" name="currency" key={country} defaultValue={initial?.countryCode === country ? initial.currency : currencies[0]} required>
          {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <Field label={h.fields.amount} name="amount" required inputMode="decimal" hint={h.fields.amountHint} error={errors.amount} defaultValue={initial ? minorToInput(initial.amountRequestedMinor) : undefined} />
      <Field label={h.fields.deadline} name="deadline" type="date" error={errors.deadline} defaultValue={initial?.deadline ? initial.deadline.slice(0, 10) : undefined} />
      <fieldset>
        <legend>{h.fields.displayMode}</legend>
        <label className="check"><input type="radio" name="displayMode" value="ANONYMOUS" checked={displayMode === 'ANONYMOUS'} onChange={() => setDisplayMode('ANONYMOUS')} /> {h.fields.anonymous}</label>
        <label className="check"><input type="radio" name="displayMode" value="DISPLAY_NAME" checked={displayMode === 'DISPLAY_NAME'} onChange={() => setDisplayMode('DISPLAY_NAME')} /> {h.fields.displayName}</label>
        {displayMode === 'DISPLAY_NAME' && (
          <Field label={h.fields.publicDisplayName} name="publicDisplayName" required error={errors.publicDisplayName} defaultValue={initial?.publicDisplayName ?? undefined} />
        )}
      </fieldset>
      <div><button className="btn" type="submit" disabled={busy}>{submitLabel}</button></div>
    </form>
  );
}
