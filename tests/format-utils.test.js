import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMoney, formatTonnage, formatDate, matchTrucks } from '../shared/format-utils.js';

test('money: 2 decimals + Indian lakh/crore grouping + rupee sign', () => {
  assert.equal(formatMoney(1234567.5), '₹12,34,567.50');
  assert.equal(formatMoney(100), '₹100.00');
  assert.equal(formatMoney(10000000), '₹1,00,00,000.00');
  assert.equal(formatMoney(0), '₹0.00');
});
test('money: negative and rounding', () => {
  assert.equal(formatMoney(-1234.5), '-₹1,234.50');
  assert.equal(formatMoney(1.005), '₹1.01');
});
test('money: invalid input gives zero, never NaN', () => {
  assert.equal(formatMoney('abc'), '₹0.00');
  assert.equal(formatMoney(null), '₹0.00');
});
test('tonnage: always 3 decimals', () => {
  assert.equal(formatTonnage(10.5), '10.500');
  assert.equal(formatTonnage('7'), '7.000');
  assert.equal(formatTonnage(1.23456), '1.235');
});
test('date: DD-MMM-YYYY from ISO string, Date and DD/MM/YYYY', () => {
  assert.equal(formatDate('2026-11-14'), '14-Nov-2026');
  assert.equal(formatDate(new Date(2026, 0, 5)), '05-Jan-2026');
  assert.equal(formatDate('14/11/2026'), '14-Nov-2026');
  assert.equal(formatDate('garbage'), '');
});
test('truck autocomplete: last 4 digits typed', () => {
  const list = ['OD 19 B 1234', 'OD-19-C-5678', 'JH 03 AB 9234', 'OD19D0034'];
  assert.deepEqual(matchTrucks(list, '1234'), ['OD 19 B 1234']);
  assert.deepEqual(matchTrucks(list, '234'), ['OD 19 B 1234', 'JH 03 AB 9234']);
  assert.deepEqual(matchTrucks(list, ''), []);
  assert.deepEqual(matchTrucks(list, '0034'), ['OD19D0034']);
});

import { parseDate, normalizeTruck } from '../shared/format-utils.js';
test('parseDate: ISO, d/m/y, DD-MMM-YYYY; rejects impossible dates', () => {
  assert.equal(parseDate('2026-11-14'), '2026-11-14');
  assert.equal(parseDate('14/11/2026'), '2026-11-14');
  assert.equal(parseDate('14-Nov-2026'), '2026-11-14');
  assert.equal(parseDate('31-02-2026'), '');
  assert.equal(parseDate(''), '');
  assert.equal(parseDate(new Date(2026, 10, 14)), '2026-11-14');
});
test('normalizeTruck strips spaces/hyphens and uppercases', () => {
  assert.equal(normalizeTruck('od 19-b 1234'), 'OD19B1234');
});
