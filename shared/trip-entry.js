// Trip entry: builds the record to save. Rate/amount are LOCKED at entry time from Master.
import { findTruck } from './vendor-master.js';
import { parseDate, roundTo } from './format-utils.js';
import { basicAmount } from './calc-engine.js';

const newId = () => globalThis.crypto.randomUUID();

export function nextFocus(index, count, key) {
  if (key !== 'Enter') return { action: 'none' };
  return index >= count - 1 ? { action: 'submit' } : { action: 'focus', index: index + 1 };
}

export function buildTripRecord({ form, masterIndex, user, now = new Date(), id }) {
  if (!user) throw new Error('user is required');
  const date = parseDate(form.date);
  if (!date) throw new Error('A valid date is required (DD-MMM-YYYY)');
  const m = findTruck(masterIndex, form.truck);
  const weight = roundTo(Number(form.weight), 3);
  if (!(weight > 0)) throw new Error('Weight must be greater than 0');
  if (m.rate === null) throw new Error('Master rate is missing for ' + m.truck);
  if (!m.vendor) throw new Error('Master vendor is missing for ' + m.truck);
  return { id: id || newId(), timestamp: now.toISOString(), date, truck: m.truck, vendor: m.vendor, weight,
    rate: m.rate, amount: basicAmount(m.rate, weight), remarks: form.remarks || '', enteredBy: user };
}

// Browser helper: Enter moves to next field / submits; after save the cursor returns to the Date field.
export function wireEntryForm({ fields, dateField, onSubmit }) {
  fields.forEach((el, i) => el.addEventListener('keydown', async ev => {
    const step = nextFocus(i, fields.length, ev.key);
    if (step.action === 'none') return;
    ev.preventDefault();
    if (step.action === 'focus') return fields[step.index].focus();
    const ok = await onSubmit(Object.fromEntries(fields.map(f => [f.name || f.id, f.value])));
    if (ok !== false) { fields.forEach(f => { if (f !== dateField) f.value = ''; }); dateField.focus(); }
  }));
}
