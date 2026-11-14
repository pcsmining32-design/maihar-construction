import test from 'node:test';
import assert from 'node:assert/strict';
import { rowsToObjects, pick, createApi } from '../shared/api-client.js';

test('rowsToObjects maps by header NAME; duplicate header -> first column wins', () => {
  const o = rowsToObjects(['id', 'Truck No', 'vendor', 'vendor'], [[1, 'OD1', 'A', 'B']]);
  assert.deepEqual(o, [{ id: 1, 'Truck No': 'OD1', vendor: 'A' }]);
});
test('rowsToObjects is position-proof: inserted column does not shift others', () => {
  const before = rowsToObjects(['truck', 'rate'], [['T1', 34]])[0];
  const after = rowsToObjects(['truck', 'newcol', 'rate'], [['T1', 'x', 34]])[0];
  assert.equal(pick(before, ['rate']), 34);
  assert.equal(pick(after, ['rate']), 34);
});
test('pick: case/space/symbol-insensitive, candidate priority, undefined if absent', () => {
  const row = { 'TDS%': 2, 'Truck No': 'T1' };
  assert.equal(pick(row, ['tdsPercent', 'tds%']), 2);
  assert.equal(pick(row, ['truckNo']), 'T1');
  assert.equal(pick(row, ['nothing']), undefined);
});
test('createApi get/post: builds URL, text/plain POST, throws on error payloads', async () => {
  const seen = [];
  const fetchImpl = async (url, opt) => { seen.push([url, opt]); return { ok: true, json: async () => ({ ok: true, data: 1 }) }; };
  const api = createApi({ url: 'https://script.google.com/macros/s/X/exec', fetchImpl });
  assert.deepEqual(await api.get({ action: 'a b' }), { ok: true, data: 1 });
  assert.equal(seen[0][0], 'https://script.google.com/macros/s/X/exec?action=a%20b');
  await api.post({ type: 't' });
  assert.equal(seen[1][1].method, 'POST');
  assert.match(seen[1][1].headers['Content-Type'], /text\/plain/);
  const bad = createApi({ url: 'https://x.test/exec', fetchImpl: async () => ({ ok: true, json: async () => ({ error: 'nope' }) }) });
  await assert.rejects(() => bad.get({}), /nope/);
  assert.throws(() => createApi({ url: '', fetchImpl }), /URL/);
});
