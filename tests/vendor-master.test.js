import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePercent, parseNumCell, resolveTdsPct, normalizeMasterRow, buildMasterIndex, findTruck, prepareMasterUpdate } from '../shared/vendor-master.js';
import { PROJECTS } from '../shell/project-registry.js';

test('parsePercent: blank=null, 0 stays 0, "2%" -> 2, junk throws', () => {
  assert.equal(parsePercent(''), null);
  assert.equal(parsePercent(null), null);
  assert.equal(parsePercent(0), 0);
  assert.equal(parsePercent('2%'), 2);
  assert.throws(() => parsePercent('abc'));
});
test('parseNumCell: blank=null but explicit 0 is kept (not defaulted)', () => {
  assert.equal(parseNumCell(''), null);
  assert.equal(parseNumCell(0), 0);
  assert.equal(parseNumCell('150'), 150);
});
test('TDS: blank -> default 1, explicit 0 honoured, only 0/1/2 allowed', () => {
  assert.equal(resolveTdsPct('', 1), 1);
  assert.equal(resolveTdsPct(0, 1), 0);
  assert.equal(resolveTdsPct('2%', 1), 2);
  assert.throws(() => resolveTdsPct(5, 1), /0, 1 or 2/);
});
const raw = { 'Truck No': 'OD 19 B 1234', 'Vendor Name': 'Ram', 'Rate PER TON': 34, 'DIESEL RATE PER LITER': 103.75,
  'URIA RATE PER LITER': 44, 'TDS%': '2%', 'GST 18%': 18, 'DRIVER INCENTIVE PER TRIP': 0 };
test('normalizeMasterRow reads by header name (Hopper-style headers)', () => {
  assert.deepEqual(normalizeMasterRow(raw), { truck: 'OD 19 B 1234', vendor: 'Ram', rate: 34, dieselRate: 103.75,
    ureaRate: 44, tdsPct: 2, gstPct: 18, tpRate: 0 });
});
test('normalizeMasterRow also reads Mira-style headers; blank row -> null', () => {
  const m = normalizeMasterRow({ truckNo: 'JH1', vendorName: 'V', tonnageRate: 50, dieselIssueRate: 100, tdsPercent: 1, gstPercent: 5 });
  assert.equal(m.rate, 50); assert.equal(m.dieselRate, 100); assert.equal(m.tdsPct, 1); assert.equal(m.gstPct, 5);
  assert.equal(normalizeMasterRow({ 'Truck No': '  ' }), null);
});
test('buildMasterIndex + findTruck: exact, last-4, ambiguous, missing', () => {
  const idx = buildMasterIndex([raw, { 'Truck No': 'JH 03 AB 9234', 'Vendor Name': 'Sam', 'TDS%': 1 }, { 'Truck No': 'OD 19 C 5234', 'Vendor Name': 'Sam' }]);
  assert.equal(findTruck(idx, 'od19b1234').truck, 'OD 19 B 1234');
  assert.equal(findTruck(idx, '1234').vendor, 'Ram');
  assert.throws(() => findTruck(idx, '234'), /more than one/i);
  assert.throws(() => findTruck(idx, '0000'), /not found/i);
});
test('duplicate truck in Master is rejected, never silently merged', () => {
  assert.throws(() => buildMasterIndex([raw, raw]), /duplicate/i);
});
test('Master edit allowed only for admin of that project', () => {
  const row = { truck: 'T1', vendor: 'V' };
  const admin = { roleDoc: { projects: { flyash: 'admin' } } };
  const op = { roleDoc: { projects: { flyash: 'operator' } } };
  assert.equal(prepareMasterUpdate({ session: admin, projectId: 'flyash', registry: PROJECTS, row }).type, 'masterUpdate');
  assert.throws(() => prepareMasterUpdate({ session: op, projectId: 'flyash', registry: PROJECTS, row }), /admin/i);
  assert.throws(() => prepareMasterUpdate({ session: admin, projectId: 'flyash', registry: PROJECTS, row: { truck: '' } }), /truck/i);
});
