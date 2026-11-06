/** Money is stored in whole minor units (cents). These helpers never use floating point for storage. */

export function formatMoney(minor: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 100);
}

/** Parses "240", "240.5" or "240,50" into minor units. Returns null if the text is not a valid amount. */
export function parseAmountToMinor(text: string): number | null {
  const m = text.trim().replace(/\s/g, '').match(/^(\d{1,7})(?:[.,](\d{1,2}))?$/);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
}

export function minorToInput(minor: number) {
  return (minor / 100).toFixed(2).replace(/\.00$/, '');
}
