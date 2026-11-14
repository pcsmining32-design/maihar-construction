// GST / TDS / Profit engine — single source of truth for all projects.
// GST and TDS are applied ONLY to Basic Amount. All money rounded to 2 decimals per step.
export const round2 = n => {
  const s = n < 0 ? -1 : 1;
  return s * Number(Math.round(Number(Math.abs(n) + 'e2')) + 'e-2');
};
function num(v, name) {
  if (typeof v === 'string' && v.trim() === '') throw new Error(name + ' is required');
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) throw new Error(name + ' must be a number');
  return n;
}

export const basicAmount = (rate, qty) => round2(num(rate, 'rate') * num(qty, 'qty'));                  // step 1
export const gstAmount = (basic, gstPct) => round2(num(basic, 'basic') * num(gstPct, 'gstPct') / 100);   // step 2
export const grossBilled = (basic, gst, withGst) => round2(num(basic, 'basic') + (withGst ? num(gst, 'gst') : 0)); // step 3
export function tdsAmount(basic, tdsPct) {                                                           // step 4
  const p = num(tdsPct, 'tdsPct');
  if (p !== 0 && p !== 1 && p !== 2) throw new Error('tdsPct must be 0, 1 or 2');
  return round2(num(basic, 'basic') * p / 100);
}
export const netBeforeExpenses = (gross, tds) => round2(num(gross, 'gross') - num(tds, 'tds'));          // step 5
export function netPayable(net, d = {}) {                                                            // step 6
  return round2(num(net, 'net') - num(d.diesel || 0, 'diesel') - num(d.urea || 0, 'urea') - num(d.other || 0, 'other'));
}
export function paymentSplit(amount, type) {                                                         // step 7
  const a = num(amount, 'amount');
  if (type === 'A') { const now = round2(a * 0.7); return { payNow: now, held: round2(a - now) }; }
  if (type === 'B') return { payNow: round2(a), held: 0 };
  throw new Error("vendorType must be 'A' or 'B'");
}
export function businessProfit(revenue, e = {}) {                                                    // step 8
  const keys = ['diesel','urea','staffSalary','driverPayment','vendorPayments','maintenance','other'];
  const total = keys.reduce((s, k) => s + num(e[k] || 0, k), 0);
  return round2(num(revenue, 'revenue') - total);
}
// Step 9: both views side by side. billFromBasic takes an already-locked basic amount (sum of trip amounts).
export function billFromBasic({ basic, gstPct, tdsPct, deductions = {}, vendorType }) {
  const b = round2(num(basic, 'basic'));
  const gst = gstAmount(b, gstPct);
  const tds = tdsAmount(b, tdsPct);
  const view = withGst => {
    const gross = grossBilled(b, gst, withGst);
    const nbe = netBeforeExpenses(gross, tds);
    const np = netPayable(nbe, deductions);
    return { gross, tds, netBeforeExpenses: nbe, netPayable: np, split: paymentSplit(np, vendorType) };
  };
  return { basic: b, gst, withGst: view(true), withoutGst: view(false) };
}
export function computeBill({ rate, qty, gstPct, tdsPct, deductions = {}, vendorType }) {
  return billFromBasic({ basic: basicAmount(rate, qty), gstPct, tdsPct, deductions, vendorType });
}
