// Vendor statement: trips come from TripEntry (own vendor column); per-truck TDS%/GST% from Master.
import { filterRows } from './reports.js';
import { billFromBasic, round2, paymentSplit } from './calc-engine.js';
import { normalizeTruck } from './format-utils.js';

const sum = (rows, key = 'amount') => round2(rows.reduce((s, r) => s + (Number(r[key]) || 0), 0));
const masterOf = (idx, truck) => idx[normalizeTruck(truck)];

export function vendorStatement({ vendor, trips, diesel = [], urea = [], otherExpenses = [], payments = [], masterIndex,
  vendorType, from, to, defaultGstPct = 0 }) {
  const range = { from, to };
  const vTrips = filterRows(trips, range).filter(t => t.vendor === vendor);
  const forVendor = rows => filterRows(rows, range).filter(r => (masterOf(masterIndex, r.truck) || {}).vendor === vendor);
  const vDiesel = forVendor(diesel), vUrea = forVendor(urea), vOther = forVendor(otherExpenses);

  const trucks = [...new Set([...vTrips, ...vDiesel, ...vUrea, ...vOther].map(r => r.truck))].sort();
  const lines = trucks.map(truck => {
    const m = masterOf(masterIndex, truck);
    if (!m) throw new Error('Truck not found in Master: ' + truck);
    const mine = rows => rows.filter(r => r.truck === truck);
    const d = sum(mine(vDiesel)), u = sum(mine(vUrea)), o = sum(mine(vOther));
    const bill = billFromBasic({ basic: sum(mine(vTrips)), gstPct: m.gstPct ?? defaultGstPct, tdsPct: m.tdsPct,
      deductions: { diesel: d, urea: u, other: o }, vendorType });
    return { truck, diesel: d, urea: u, other: o, ...bill };
  });

  const total = pick => round2(lines.reduce((s, l) => s + pick(l), 0));
  const view = key => {
    const netPayable = total(l => l[key].netPayable);
    return { gross: total(l => l[key].gross), tds: total(l => l[key].tds), netPayable, split: paymentSplit(netPayable, vendorType) };
  };
  const totals = { basic: total(l => l.basic), gst: total(l => l.gst), tds: total(l => l.withGst.tds),
    diesel: total(l => l.diesel), urea: total(l => l.urea), other: total(l => l.other),
    withGst: view('withGst'), withoutGst: view('withoutGst') };
  const paid = sum(filterRows(payments, range).filter(p => p.vendor === vendor));
  return { vendor, from, to, trucks: lines, totals, paid,
    balance: { withGst: round2(totals.withGst.netPayable - paid), withoutGst: round2(totals.withoutGst.netPayable - paid) },
    payableNowBalance: { withGst: round2(totals.withGst.split.payNow - paid), withoutGst: round2(totals.withoutGst.split.payNow - paid) } };
}
