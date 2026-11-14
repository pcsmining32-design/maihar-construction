// Report aggregations. Numbers are always numeric (0 stays 0, never blank).
import { visibleRows } from './audit-log.js';
import { roundTo } from './format-utils.js';
import { round2 } from './calc-engine.js';

export function filterRows(rows, { from, to }) {
  return visibleRows(rows).filter(r => (!from || r.date >= from) && (!to || r.date <= to));
}
const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function truckWiseTotals({ trips, diesel = [], urea = [], from, to }) {
  const acc = {};
  const row = t => (acc[t] ||= { truck: t, trips: 0, tonnage: 0, dieselLiters: 0, ureaLiters: 0, amount: 0 });
  for (const t of filterRows(trips, { from, to })) { const r = row(t.truck); r.trips++; r.tonnage += num(t.weight); r.amount += num(t.amount); }
  for (const d of filterRows(diesel, { from, to })) row(d.truck).dieselLiters += num(d.liters);
  for (const u of filterRows(urea, { from, to })) row(u.truck).ureaLiters += num(u.liters);
  return Object.values(acc).sort((a, b) => a.truck.localeCompare(b.truck)).map(r => ({
    ...r, tonnage: roundTo(r.tonnage, 3), dieselLiters: roundTo(r.dieselLiters, 3), ureaLiters: roundTo(r.ureaLiters, 3), amount: round2(r.amount) }));
}

export function vendorWiseTotals({ trips, from, to }) {
  const acc = {};
  for (const t of filterRows(trips, { from, to })) {
    const r = (acc[t.vendor] ||= { vendor: t.vendor, trips: 0, tonnage: 0, amount: 0 });
    r.trips++; r.tonnage += num(t.weight); r.amount += num(t.amount);
  }
  return Object.values(acc).sort((a, b) => a.vendor.localeCompare(b.vendor))
    .map(r => ({ ...r, tonnage: roundTo(r.tonnage, 3), amount: round2(r.amount) }));
}
