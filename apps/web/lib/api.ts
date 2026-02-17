'use client';

function normalizeApiBase(rawBase: string): string {
  const trimmed = rawBase.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) return trimmed;
  return `${trimmed}/api/v1`;
}

export function getApiBaseUrl(): string {
  const envBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:4000';
  return normalizeApiBase(envBase);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('accessToken');
}

export async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getAccessToken();
  if (!token) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Not authenticated');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return fetch(`${getApiBaseUrl()}${normalizedPath}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}
