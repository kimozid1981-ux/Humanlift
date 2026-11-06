import 'server-only';
import { connection } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

/** Server-side read from the API. Returns null if the API is unreachable, so pages degrade gracefully. */
export async function serverGet<T>(path: string): Promise<T | null> {
  // Always render with live data at request time, never a build-time snapshot.
  await connection();
  try {
    const res = await fetch(`${API_URL}/v1${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
