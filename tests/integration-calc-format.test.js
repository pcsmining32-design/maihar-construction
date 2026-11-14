import test from 'node:test';
import assert from 'node:assert/strict';
import { computeBill, businessProfit } from '../shared/calc-engine.js';
import { formatMoney, formatTonnage, formatDate, matchTrucks } from '../shared/format-utils.js';

// Simulates a trip entry: truck picked by last 4 digits -> bill calculated -> shown to user.
test('integration: trip entry -> calculation -> display strings', () => {
  const trucks = ['OD 19 B 1234', 'JH 03 AB 9234'];
  const [truck] = matchTrucks(trucks, '1234');
  assert.equal(truck, 'OD 19 B 1234');

  const bill = computeBill({ rate: 1250.5, qty: 24.375, gstPct: 5, tdsPct: 2,
    deductions: { diesel: 3000, urea: 0, other: 150.25 }, vendorType: 'A' });

  assert.equal(bill.basic, 30480.94);            // 1250.5 x 24.375 = 30480.9375
  assert.equal(bill.gst, 1524.05);               // 5% of basic only
  assert.equal(bill.withGst.tds, 609.62);        // 2% of basic only (not of GST)
  assert.equal(bill.withGst.gross, 32004.99);
  assert.equal(bill.withGst.netPayable, 28245.12);
  assert.deepEqual(bill.withGst.split, { payNow: 19771.58, held: 8473.54 });

  assert.equal(formatMoney(bill.withGst.gross), '₹32,004.99');
  assert.equal(formatMoney(bill.withoutGst.gross), '₹30,480.94');
  assert.equal(formatTonnage(24.375), '24.375');
  assert.equal(formatDate('2026-11-14'), '14-Nov-2026');
  assert.equal(
    Math.round((bill.withGst.split.payNow + bill.withGst.split.held) * 100),
    Math.round(bill.withGst.netPayable * 100));
});

test('integration: period profit shown in lakh grouping', () => {
  const p = businessProfit(2500000, { diesel: 900000, vendorPayments: 800000, staffSalary: 150000 });
  assert.equal(formatMoney(p), '₹6,50,000.00');
});
