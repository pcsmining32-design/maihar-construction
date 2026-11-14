import test from 'node:test';
import assert from 'node:assert/strict';
import { rowsToObjects } from '../shared/api-client.js';
import { buildMasterIndex } from '../shared/vendor-master.js';
import { buildTripRecord } from '../shared/trip-entry.js';
import { buildFuelRecord } from '../shared/diesel-urea-entry.js';
import { softDelete } from '../shared/audit-log.js';
import { vendorStatement } from '../shared/payment-ledger.js';
import { formatMoney, formatTonnage, formatDate } from '../shared/format-utils.js';

// Master sheet with an EXTRA column inserted in the middle: must not break anything.
const headers = ['Truck No', 'Notes', 'Vendor Name', 'Rate PER TON', 'DIESEL RATE PER LITER', 'URIA RATE PER LITER', 'TDS%', 'GST 18%'];
const masterIndex = buildMasterIndex(rowsToObjects(headers, [['OD 19 B 1234', 'new col', 'Ram', 34, 103.75, 44, '2%', 18]]));
const now = new Date('2026-11-14T10:00:00Z');
const range = { from: '2026-11-01', to: '2026-11-30' };

test('full flow: Master -> trip + fuel entry -> soft delete -> vendor statement -> display strings', () => {
  const trips = [
    buildTripRecord({ form: { date: '02-Nov-2026', truck: '1234', weight: 24.375 }, masterIndex, user: 'op@x.com', now, id: 't1' }),
    buildTripRecord({ form: { date: '03-Nov-2026', truck: '1234', weight: 10 }, masterIndex, user: 'op@x.com', now, id: 't2' }),
    buildTripRecord({ form: { date: '04-Nov-2026', truck: '1234', weight: 99 }, masterIndex, user: 'op@x.com', now, id: 't3' }),
  ];
  const diesel = [buildFuelRecord({ kind: 'diesel', form: { date: '02-Nov-2026', truck: '1234', liters: 5 }, masterIndex, user: 'op@x.com', now, id: 'd1' })];
  const urea = [buildFuelRecord({ kind: 'urea', form: { date: '02-Nov-2026', truck: '1234', liters: 10 }, masterIndex, user: 'op@x.com', now, id: 'u1' })];

  // Operator mistake t3 is soft-deleted (confirmed + reason) - row stays, calculation ignores it
  const del = softDelete({ user: 'admin@x.com', entity: 'TripEntry', id: 't3', confirmed: true, reason: 'wrong weight', now });
  Object.assign(trips[2], del.patch);
  assert.equal(trips.length, 3);

  const s = vendorStatement({ vendor: 'Ram', trips, diesel, urea, payments: [{ date: '2026-11-10', vendor: 'Ram', amount: 100 }],
    masterIndex, vendorType: 'A', ...range });
  assert.equal(s.totals.basic, 1168.75);      // 828.75 + 340.00
  assert.equal(s.totals.gst, 210.38);         // 18% of basic only
  assert.equal(s.totals.tds, 23.38);          // 2% of basic only
  assert.equal(s.totals.diesel, 518.75);
  assert.equal(s.totals.urea, 440);
  assert.equal(s.totals.withoutGst.netPayable, 186.62);
  assert.equal(s.totals.withGst.netPayable, 397);
  assert.equal(s.balance.withGst, 297);

  assert.equal(formatMoney(s.totals.withGst.netPayable), '₹397.00');
  assert.equal(formatTonnage(34.375), '34.375');
  assert.equal(formatDate(trips[0].date), '02-Nov-2026');
});
