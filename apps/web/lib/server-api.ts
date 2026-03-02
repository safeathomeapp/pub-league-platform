function normalizeApiBase(rawBase: string): string {
  const trimmed = rawBase.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) return trimmed;
  return `${trimmed}/api/v1`;
}

export function getServerApiBaseUrl(): string {
  const envBase =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:4000';
  return normalizeApiBase(envBase);
}
