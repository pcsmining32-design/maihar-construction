// Shared formatting helpers — used by every project. Do not duplicate per project.
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function toNum(v) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

// Round half away from zero at given decimals, avoiding float drift (1.005 -> 1.01).
export function roundTo(n, d) {
  const sign = n < 0 ? -1 : 1;
  return sign * Number(Math.round(Number(Math.abs(n) + 'e' + d)) + 'e-' + d);
}

function indianGroup(intStr) {
  if (intStr.length <= 3) return intStr;
  const last3 = intStr.slice(-3);
  const rest = intStr.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return rest + ',' + last3;
}

export function formatMoney(v) {
  const n = roundTo(toNum(v), 2);
  const [i, d] = Math.abs(n).toFixed(2).split('.');
  return (n < 0 ? '-' : '') + '₹' + indianGroup(i) + '.' + d;
}

export function formatTonnage(v) {
  return roundTo(toNum(v), 3).toFixed(3);
}

export function parseDate(v) {
  let y, m, d;
  if (v instanceof Date) {
    if (isNaN(v)) return '';
    y = v.getFullYear(); m = v.getMonth() + 1; d = v.getDate();
  } else if (typeof v === 'string') {
    const s = v.trim();
    let a;
    if ((a = /^(\d{4})-(\d{2})-(\d{2})/.exec(s))) { y = +a[1]; m = +a[2]; d = +a[3]; }
    else if ((a = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(s))) { d = +a[1]; m = +a[2]; y = +a[3]; }
    else if ((a = /^(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{4})$/.exec(s))) {
      m = MONTHS.findIndex(x => x.toLowerCase() === a[2].toLowerCase()) + 1; d = +a[1]; y = +a[3];
      if (m < 1) return '';
    } else return '';
  } else return '';
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (m < 1 || m > 12 || dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return '';
  return String(y) + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}

export function formatDate(v) {
  const iso = parseDate(v);
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d + '-' + MONTHS[+m - 1] + '-' + y;
}

export const normalizeTruck = s => String(s).replace(/[\s-]/g, '').toUpperCase();

// Autocomplete: match trucks whose number ENDS with the typed digits.
export function matchTrucks(list, typed) {
  const t = normalizeTruck(typed || '');
  if (!t) return [];
  return list.filter(x => normalizeTruck(x).endsWith(t));
}
