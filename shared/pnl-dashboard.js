// Business profit (separate from vendor payment): Total Revenue - Total Expense, in both views.
import { filterRows } from './reports.js';
import { businessProfit, gstAmount, round2 } from './calc-engine.js';
import { normalizeTruck } from './format-utils.js';

const CATEGORIES = ['diesel', 'urea', 'staffSalary', 'driverPayment', 'vendorPayments', 'maintenance', 'other'];

export function periodPnl({ trips, expenses = [], masterIndex, from, to, defaultGstPct = 0 }) {
  const byTruck = {};
  for (const t of filterRows(trips, { from, to })) byTruck[t.truck] = (byTruck[t.truck] || 0) + (Number(t.amount) || 0);
  let basic = 0, gst = 0;
  for (const [truck, amt] of Object.entries(byTruck)) {
    const m = masterIndex[normalizeTruck(truck)];
    basic += amt; gst += gstAmount(round2(amt), (m && m.gstPct) ?? defaultGstPct);
  }
  basic = round2(basic); gst = round2(gst);
  const expenseByCategory = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
  for (const e of filterRows(expenses, { from, to })) {
    const c = CATEGORIES.includes(e.category) ? e.category : 'other';
    expenseByCategory[c] = round2(expenseByCategory[c] + (Number(e.amount) || 0));
  }
  const expense = round2(Object.values(expenseByCategory).reduce((s, v) => s + v, 0));
  const withGstRevenue = round2(basic + gst);
  return {
    withoutGst: { revenue: basic, expense, profit: businessProfit(basic, expenseByCategory) },
    withGst: { revenue: withGstRevenue, expense, profit: businessProfit(withGstRevenue, expenseByCategory) },
    gstCollected: gst, expenseByCategory,
  };
}
