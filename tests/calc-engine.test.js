import test from 'node:test';
import assert from 'node:assert/strict';
import { basicAmount, gstAmount, grossBilled, tdsAmount, netBeforeExpenses,
  netPayable, paymentSplit, businessProfit, computeBill } from '../shared/calc-engine.js';

// Worked example: Rate 100/ton, qty 10.5 ton, GST 18%, TDS 1%
test('step1 basic = rate x qty', () => assert.equal(basicAmount(100, 10.5), 1050));
test('step2 GST only on basic', () => assert.equal(gstAmount(1050, 18), 189));
test('step3 gross = basic + GST (with GST)', () => assert.equal(grossBilled(1050, 189, true), 1239));
test('step3 gross = basic only (without GST)', () => assert.equal(grossBilled(1050, 189, false), 1050));
test('step4 TDS only on basic, never on GST', () => {
  assert.equal(tdsAmount(1050, 1), 10.5);
  assert.equal(tdsAmount(1050, 2), 21);
});
test('step5 net before expenses = gross - TDS', () => assert.equal(netBeforeExpenses(1239, 10.5), 1228.5));
test('step6 net payable = step5 - diesel - urea - other', () =>
  assert.equal(netPayable(1228.5, { diesel: 200, urea: 50, other: 25 }), 953.5));
test('step7 Type A = 70% now / 30% held', () =>
  assert.deepEqual(paymentSplit(953.5, 'A'), { payNow: 667.45, held: 286.05 }));
test('step7 Type B = 100% straight', () =>
  assert.deepEqual(paymentSplit(953.5, 'B'), { payNow: 953.5, held: 0 }));
test('step7 split always sums back exactly', () => {
  const s = paymentSplit(333.33, 'A');
  assert.equal(Math.round((s.payNow + s.held) * 100), 33333);
});
test('step8 business profit = revenue - all expenses', () =>
  assert.equal(businessProfit(500000, { diesel: 100000, urea: 10000, staffSalary: 50000,
    driverPayment: 40000, vendorPayments: 150000, maintenance: 20000, other: 5000 }), 125000));
test('step8 profit can be negative', () => assert.equal(businessProfit(1000, { diesel: 1500 }), -500));
test('step9 computeBill returns BOTH views side by side', () => {
  const r = computeBill({ rate: 100, qty: 10.5, gstPct: 18, tdsPct: 1,
    deductions: { diesel: 200, urea: 50, other: 25 }, vendorType: 'A' });
  assert.equal(r.withGst.gross, 1239);
  assert.equal(r.withGst.netPayable, 953.5);
  assert.equal(r.withoutGst.gross, 1050);
  assert.equal(r.withoutGst.netPayable, 764.5);
  assert.equal(r.withGst.tds, r.withoutGst.tds);
  assert.deepEqual(r.withGst.split, { payNow: 667.45, held: 286.05 });
});
test('rejects bad input instead of returning NaN', () => {
  assert.throws(() => basicAmount('x', 1));
  assert.throws(() => tdsAmount(100, 5));
  assert.throws(() => paymentSplit(100, 'Z'));
});

import { billFromBasic, round2 } from '../shared/calc-engine.js';
test('TDS 0% is valid (explicit zero in Master = no TDS), 3% still rejected', () => {
  assert.equal(tdsAmount(1050, 0), 0);
  assert.throws(() => tdsAmount(1050, 3));
});
test('billFromBasic equals computeBill when basic is the same', () => {
  const a = computeBill({ rate: 100, qty: 10.5, gstPct: 18, tdsPct: 1, deductions: { diesel: 200, urea: 50, other: 25 }, vendorType: 'A' });
  const b = billFromBasic({ basic: 1050, gstPct: 18, tdsPct: 1, deductions: { diesel: 200, urea: 50, other: 25 }, vendorType: 'A' });
  assert.deepEqual(b, a);
  assert.equal(round2(1.005), 1.01);
});
