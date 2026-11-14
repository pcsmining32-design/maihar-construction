// Talks to a project's existing Apps Script Web App. Columns are ALWAYS addressed by header name.
const norm = h => String(h).toLowerCase().replace(/[^a-z0-9]/g, '');

export function rowsToObjects(headers, rows) {
  return rows.map(r => {
    const o = {};
    headers.forEach((h, i) => { if (!(h in o)) o[h] = r[i]; });   // duplicate header: first column wins
    return o;
  });
}

export function pick(obj, candidates) {
  const map = new Map();
  for (const k of Object.keys(obj)) { const n = norm(k); if (!map.has(n)) map.set(n, k); }
  for (const c of candidates) { const k = map.get(norm(c)); if (k !== undefined) return obj[k]; }
  return undefined;
}

export function createApi({ url, fetchImpl = globalThis.fetch }) {
  if (!url || !/^https:\/\//.test(url)) throw new Error('Apps Script Web App URL is required (https://...)');
  const parse = async res => {
    if (!res.ok) throw new Error('Server error ' + res.status);
    const data = await res.json();
    if (data && (data.error || data.ok === false)) throw new Error(data.error || 'Request failed');
    return data;
  };
  return {
    get: params => fetchImpl(url + '?' + new URLSearchParams(params).toString().replace(/\+/g, '%20')).then(parse),
    post: body => fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }).then(parse),
  };
}
