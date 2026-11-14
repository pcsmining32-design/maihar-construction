import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMasterIndex } from '../shared/vendor-master.js';
import { buildTripRecord, nextFocus } from '../shared/trip-entry.js';
import { buildFuelRecord } from '../shared/diesel-urea-entry.js';

const masterIndex = buildMasterIndex([
  { 'Truck No': 'OD 19 B 1234', 'Vendor Name': 'Ram', 'Rate PER TON': 34, 'DIESEL RATE PER LITER': 103.75, 'URIA RATE PER LITER': 44, 'TDS%': 1 },
  { 'Truck No': 'JH 03 AB 9234', 'Vendor Name': 'Sam', 'Rate PER TON': '', 'TDS%': 2 },
]);
const now = new Date('2026-11-14T10:00:00Z');

test('Enter moves to next field; Enter on last field submits; other keys do nothing', () => {
  assert.deepEqual(nextFocus(0, 4, 'Enter'), { action: 'focus', index: 1 });
  assert.deepEqual(nextFocus(3, 4, 'Enter'), { action: 'submit' });
  assert.deepEqual(nextFocus(1, 4, 'a'), { action: 'none' });
});
test('trip: truck by last 4 digits, rate LOCKED from Master, amount = rate x weight', () => {
  const r = buildTripRecord({ form: { date: '14-Nov-2026', truck: '1234', weight: '24.375', remarks: '' }, masterIndex, user: 'op@x.com', now, id: 'id1' });
  assert.deepEqual(r, { id: 'id1', timestamp: '2026-11-14T10:00:00.000Z', date: '2026-11-14', truck: 'OD 19 B 1234',
    vendor: 'Ram', weight: 24.375, rate: 34, amount: 828.75, remarks: '', enteredBy: 'op@x.com' });
});
test('trip: rejects bad date, zero weight, unknown truck, missing Master rate', () => {
  const base = { date: '2026-11-14', truck: '1234', weight: 10 };
  const mk = f => () => buildTripRecord({ form: { ...base, ...f }, masterIndex, user: 'u', now, id: 'x' });
  assert.throws(mk({ date: 'zzz' }), /date/i);
  assert.throws(mk({ weight: 0 }), /weight/i);
  assert.throws(mk({ truck: '7777' }), /not found/i);
  assert.throws(mk({ truck: '9234' }), /rate/i);
});
test('diesel/urea: rate locked from Master, amount 2 decimals', () => {
  const d = buildFuelRecord({ kind: 'diesel', form: { date: '2026-11-14', truck: '1234', liters: '50.5' }, masterIndex, user: 'u', now, id: 'd1' });
  assert.equal(d.rate, 103.75); assert.equal(d.amount, 5239.38); assert.equal(d.kind, 'diesel');
  const u = buildFuelRecord({ kind: 'urea', form: { date: '2026-11-14', truck: '1234', liters: 10 }, masterIndex, user: 'u', now, id: 'u1' });
  assert.equal(u.amount, 440);
});
test('fuel: missing Master rate / bad kind / zero liters rejected', () => {
  const f = { date: '2026-11-14', truck: '9234', liters: 5 };
  assert.throws(() => buildFuelRecord({ kind: 'diesel', form: f, masterIndex, user: 'u', now, id: 'x' }), /rate/i);
  assert.throws(() => buildFuelRecord({ kind: 'petrol', form: { ...f, truck: '1234' }, masterIndex, user: 'u', now, id: 'x' }), /kind/i);
  assert.throws(() => buildFuelRecord({ kind: 'diesel', form: { ...f, truck: '1234', liters: 0 }, masterIndex, user: 'u', now, id: 'x' }), /liters/i);
});
