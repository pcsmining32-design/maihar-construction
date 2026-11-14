import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMasterIndex } from '../shared/vendor-master.js';
import { vendorStatement } from '../shared/payment-ledger.js';
import { periodPnl } from '../shared/pnl-dashboard.js';
import { filterRows, truckWiseTotals, vendorWiseTotals } from '../shared/reports.js';

const masterIndex = buildMasterIndex([
  { 'Truck No': 'T1', 'Vendor Name': 'V1', 'TDS%': 1, 'GST 18%': 18 },
  { 'Truck No': 'T2', 'Vendor Name': 'V1', 'TDS%': 2, 'GST 18%': 18 },
  { 'Truck No': 'T3', 'Vendor Name': 'V2', 'TDS%': 1, 'GST 18%': 18 },
]);
const trips = [
  { date: '2026-11-02', truck: 'T1', vendor: 'V1', weight: 10, amount: 1000 },
  { date: '2026-11-03', truck: 'T1', vendor: 'V1', weight: 5, amount: 500 },
  { date: '2026-11-03', truck: 'T2', vendor: 'V1', weight: 20, amount: 2000 },
  { date: '2026-10-01', truck: 'T1', vendor: 'V1', weight: 7, amount: 777 },           // outside range
  { date: '2026-11-04', truck: 'T1', vendor: 'V1', weight: 9, amount: 888, deleted: true }, // soft-deleted
  { date: '2026-11-04', truck: 'T3', vendor: 'V2', weight: 4, amount: 400 },
];
const diesel = [{ date: '2026-11-02', truck: 'T1', liters: 1, amount: 100 }, { date: '2026-11-03', truck: 'T2', liters: 2, amount: 200 }];
const urea = [{ date: '2026-11-02', truck: 'T1', liters: 1, amount: 50 }];
const payments = [{ date: '2026-11-10', vendor: 'V1', amount: 1000 }, { date: '2026-11-11', vendor: 'V1', amount: 999, deleted: true }];
const range = { from: '2026-11-01', to: '2026-11-15' };

test('vendor statement: per-truck TDS%, GST on basic only, both views, soft-deleted + out-of-range ignored', () => {
  const s = vendorStatement({ vendor: 'V1', trips, diesel, urea, payments, masterIndex, vendorType: 'A', ...range });
  assert.deepEqual(s.trucks.map(t => t.truck), ['T1', 'T2']);
  assert.equal(s.totals.basic, 3500);
  assert.equal(s.totals.gst, 630);
  assert.equal(s.totals.tds, 55);
  assert.equal(s.totals.diesel, 300); assert.equal(s.totals.urea, 50);
  assert.equal(s.totals.withGst.netPayable, 3725);
  assert.equal(s.totals.withoutGst.netPayable, 3095);
  assert.deepEqual(s.totals.withGst.split, { payNow: 2607.5, held: 1117.5 });
  assert.equal(s.paid, 1000);
  assert.deepEqual(s.balance, { withGst: 2725, withoutGst: 2095 });
  assert.deepEqual(s.payableNowBalance, { withGst: 1607.5, withoutGst: 1166.5 });
});
test('vendor statement: other expenses (e.g. driver TP) reduce net payable', () => {
  const s = vendorStatement({ vendor: 'V2', trips, diesel: [], urea: [], payments: [], masterIndex, vendorType: 'B',
    otherExpenses: [{ date: '2026-11-04', truck: 'T3', amount: 25 }], ...range });
  assert.equal(s.totals.withoutGst.netPayable, 400 - 4 - 25);
  assert.deepEqual(s.totals.withoutGst.split, { payNow: 371, held: 0 });
});
test('vendor with no activity gives zeros, not NaN', () => {
  const s = vendorStatement({ vendor: 'V9', trips, diesel, urea, payments, masterIndex, vendorType: 'A', ...range });
  assert.equal(s.totals.basic, 0); assert.equal(s.balance.withGst, 0);
});
test('period P&L: both views, expenses by category, unknown category -> other', () => {
  const p = periodPnl({ trips: trips.filter(t => t.vendor === 'V1' && t.truck !== 'T3'), masterIndex, ...range,
    expenses: [{ date: '2026-11-05', category: 'diesel', amount: 500 }, { date: '2026-11-05', category: 'staffSalary', amount: 300 },
      { date: '2026-11-05', category: 'driverPayment', amount: 100 }, { date: '2026-11-06', category: 'vendorPayments', amount: 1000 },
      { date: '2026-11-06', category: 'tea', amount: 50 }, { date: '2026-11-06', category: 'diesel', amount: 9, deleted: true }] });
  assert.equal(p.withoutGst.revenue, 3500);
  assert.equal(p.withGst.revenue, 4130);
  assert.equal(p.withoutGst.expense, 1950);
  assert.equal(p.withoutGst.profit, 1550);
  assert.equal(p.withGst.profit, 2180);
  assert.equal(p.expenseByCategory.other, 50);
});
test('reports: filterRows by date range + hides deleted', () => {
  assert.equal(filterRows(trips, range).length, 4);
});
test('reports: truck-wise totals always numeric (zero stays 0), tonnage 3 decimals exact', () => {
  const rows = truckWiseTotals({ trips, diesel, urea, ...range });
  const t1 = rows.find(r => r.truck === 'T1');
  assert.deepEqual(t1, { truck: 'T1', trips: 2, tonnage: 15, dieselLiters: 1, ureaLiters: 1, amount: 1500 });
  const t3 = rows.find(r => r.truck === 'T3');
  assert.equal(t3.dieselLiters, 0); assert.equal(t3.ureaLiters, 0);
  const x = truckWiseTotals({ trips: [{ date: '2026-11-02', truck: 'A', weight: 0.1, amount: 1 }, { date: '2026-11-02', truck: 'A', weight: 0.2, amount: 1 }], diesel: [], urea: [], ...range });
  assert.equal(x[0].tonnage, 0.3);
});
test('reports: vendor-wise totals', () => {
  const v = vendorWiseTotals({ trips, ...range });
  assert.deepEqual(v.map(r => [r.vendor, r.trips, r.amount]), [['V1', 3, 3500], ['V2', 1, 400]]);
});
