/**
 * api.ts — Central API base URL resolver
 *
 * In LOCAL dev:   Vite proxies /api → http://localhost:5000  (vite.config.ts)
 * In PRODUCTION:  Uses VITE_API_BASE_URL env var pointing to Render backend
 *
 * Usage:
 *   import { apiPost } from '../utils/api';
 *   const data = await apiPost('/api/ai/analyze-complaint', { description });
 */

const BASE =
  import.meta.env.VITE_API_BASE_URL ||   // set to your Render URL in Vercel env vars
  '';                                      // empty → Vite proxy handles it in dev

export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
  timeoutMs = 15000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`API ${path} failed [${res.status}]: ${text}`);
    }

    return res.json() as Promise<T>;
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`API request timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  }
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API GET ${path} failed [${res.status}]`);
  return res.json() as Promise<T>;
}
