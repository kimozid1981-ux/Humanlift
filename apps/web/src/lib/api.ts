'use client';

export type ApiResult<T = any> = { ok: boolean; status: number; data: T };

/** Calls the API through the same-origin /api proxy. Never throws for HTTP errors. */
export async function api<T = any>(path: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`/api${path}`, {
      method: init.method ?? 'GET',
      headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
  } catch {
    return { ok: false, status: 0, data: null as T };
  }
}

/** Maps API validation errors to { fieldName: code }. */
export function fieldErrors(data: any): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of data?.fields ?? []) out[f.field] = f.message && /^[a-z_]+$/.test(f.message) ? f.message : f.code;
  return out;
}
