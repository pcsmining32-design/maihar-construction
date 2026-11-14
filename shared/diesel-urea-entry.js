// Diesel / urea entry. Rate is LOCKED at entry time from Master.
import { findTruck } from './vendor-master.js';
import { parseDate, roundTo } from './format-utils.js';
import { basicAmount } from './calc-engine.js';

const newId = () => globalThis.crypto.randomUUID();

export function buildFuelRecord({ kind, form, masterIndex, user, now = new Date(), id }) {
  if (kind !== 'diesel' && kind !== 'urea') throw new Error("kind must be 'diesel' or 'urea'");
  if (!user) throw new Error('user is required');
  const date = parseDate(form.date);
  if (!date) throw new Error('A valid date is required (DD-MMM-YYYY)');
  const m = findTruck(masterIndex, form.truck);
  const liters = roundTo(Number(form.liters), 3);
  if (!(liters > 0)) throw new Error('Liters must be greater than 0');
  const rate = kind === 'diesel' ? m.dieselRate : m.ureaRate;
  if (rate === null) throw new Error('Master ' + kind + ' rate is missing for ' + m.truck);
  return { id: id || newId(), timestamp: now.toISOString(), kind, date, truck: m.truck, liters, rate,
    amount: basicAmount(rate, liters), remarks: form.remarks || '', enteredBy: user };
}
