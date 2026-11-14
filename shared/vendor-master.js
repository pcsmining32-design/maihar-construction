// Master tab reading/validation. Master is the single source of truth; edited only by admins here.
import { pick } from './api-client.js';
import { normalizeTruck } from './format-utils.js';
import { canManageMaster } from '../shell/access.js';

export const DEFAULT_MASTER_COLUMNS = {
  truck: ['Truck No', 'truckNo'],
  vendor: ['Vendor Name', 'vendorName'],
  rate: ['Rate PER TON', 'tonnageRate', 'Rate'],
  dieselRate: ['DIESEL RATE PER LITER', 'dieselIssueRate', 'dieselRate'],
  ureaRate: ['URIA RATE PER LITER', 'UREA RATE PER LITER', 'ureaRate'],
  tdsPct: ['TDS%', 'tdsPercent', 'TDS'],
  gstPct: ['GST 18%', 'gstPercent', 'GST%'],
  tpRate: ['DRIVER INCENTIVE PER TRIP', 'tpRate'],
};

const blank = v => v === undefined || v === null || String(v).trim() === '';

export function parsePercent(v) {
  if (blank(v)) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace('%', '').trim());
  if (!Number.isFinite(n)) throw new Error('Not a valid percentage: ' + v);
  return n;
}
export function parseNumCell(v) {
  if (blank(v)) return null;
  const n = Number(String(v).replace(/,/g, '').trim());
  if (!Number.isFinite(n)) throw new Error('Not a valid number: ' + v);
  return n;
}
export function resolveTdsPct(cell, defaultPct = 1) {
  const p = parsePercent(cell);
  if (p === null) return defaultPct;                 // blank -> default; explicit 0 is honoured
  if (![0, 1, 2].includes(p)) throw new Error('TDS% must be 0, 1 or 2');
  return p;
}

export function normalizeMasterRow(raw, columns = DEFAULT_MASTER_COLUMNS, { defaultTdsPct = 1 } = {}) {
  const truck = pick(raw, columns.truck);
  if (blank(truck)) return null;
  return {
    truck: String(truck).trim(),
    vendor: blank(pick(raw, columns.vendor)) ? '' : String(pick(raw, columns.vendor)).trim(),
    rate: parseNumCell(pick(raw, columns.rate)),
    dieselRate: parseNumCell(pick(raw, columns.dieselRate)),
    ureaRate: parseNumCell(pick(raw, columns.ureaRate)),
    tdsPct: resolveTdsPct(pick(raw, columns.tdsPct), defaultTdsPct),
    gstPct: parsePercent(pick(raw, columns.gstPct)),
    tpRate: parseNumCell(pick(raw, columns.tpRate)),
  };
}

export function buildMasterIndex(rawRows, columns = DEFAULT_MASTER_COLUMNS, opts = {}) {
  const idx = {};
  for (const raw of rawRows) {
    const m = normalizeMasterRow(raw, columns, opts);
    if (!m) continue;
    const key = normalizeTruck(m.truck);
    if (idx[key]) throw new Error('Duplicate truck in Master: ' + m.truck);
    idx[key] = m;
  }
  return idx;
}

export function findTruck(masterIndex, typed) {
  const t = normalizeTruck(typed || '');
  if (!t) throw new Error('Truck number is required');
  if (masterIndex[t]) return masterIndex[t];
  const hits = Object.keys(masterIndex).filter(k => k.endsWith(t));
  if (hits.length === 1) return masterIndex[hits[0]];
  if (hits.length > 1) throw new Error('More than one truck matches "' + typed + '"; type more digits');
  throw new Error('Truck not found in Master: ' + typed);
}

export function prepareMasterUpdate({ session, projectId, registry, row }) {
  if (!canManageMaster(session && session.roleDoc, projectId, registry)) throw new Error('Only an admin can edit the Master');
  if (!row || blank(row.truck)) throw new Error('Truck number is required');
  return { type: 'masterUpdate', project: projectId, row };
}
