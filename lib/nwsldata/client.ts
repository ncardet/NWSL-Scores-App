const NWSLDATA_BASE = 'https://nwsl-database-proxy-78453984015.us-central1.run.app';

export async function runQuery<T>(sql: string): Promise<T[]> {
  const res = await fetch(`${NWSLDATA_BASE}/sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
    // No cache-busting; historical data is immutable
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`nwsldata query failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  // The proxy may return { rows: [...] } or just an array
  if (Array.isArray(data)) return data as T[];
  if (data?.rows && Array.isArray(data.rows)) return data.rows as T[];
  if (data?.data && Array.isArray(data.data)) return data.data as T[];

  return [];
}
