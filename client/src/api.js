const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const localDate = () => {
  const d = new Date();
  return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
};
export async function api(path, { method = 'GET', body } = {}) {
  const t = localStorage.getItem('cq_token');
  const q = method === 'GET' ? (path.includes('?') ? '&' : '?') + 'date=' + localDate() : '';
  const res = await fetch(`${BASE}/api${path}${q}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(t && { Authorization: `Bearer ${t}` }) },
    body: body && JSON.stringify({ ...body, date: localDate(), hour: new Date().getHours() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && t && !path.startsWith('/auth')) { localStorage.removeItem('cq_token'); location.reload(); }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}
