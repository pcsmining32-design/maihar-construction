import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAuditEntry, softDelete, assertNoHardDelete, visibleRows } from '../shared/audit-log.js';

const now = new Date('2026-11-14T10:00:00Z');
test('audit entry has who/what/when and requires user+action+entity', () => {
  const e = buildAuditEntry({ user: 'a@x.com', project: 'flyash', action: 'append', entity: 'TripEntry', id: 't1', now });
  assert.equal(e.ts, '2026-11-14T10:00:00.000Z');
  assert.equal(e.user, 'a@x.com');
  assert.throws(() => buildAuditEntry({ project: 'p', action: 'a', entity: 'e' }), /user/);
});
test('soft delete needs explicit confirmation AND a reason', () => {
  assert.throws(() => softDelete({ user: 'a@x.com', entity: 'TripEntry', id: 't1', confirmed: false, reason: 'dup' }), /confirm/i);
  assert.throws(() => softDelete({ user: 'a@x.com', entity: 'TripEntry', id: 't1', confirmed: true, reason: '' }), /reason/i);
  const r = softDelete({ user: 'a@x.com', project: 'flyash', entity: 'TripEntry', id: 't1', confirmed: true, reason: 'duplicate', now });
  assert.deepEqual(r.patch, { deleted: true, deletedBy: 'a@x.com', deletedAt: '2026-11-14T10:00:00.000Z', deleteReason: 'duplicate' });
  assert.equal(r.audit.action, 'soft-delete');
});
test('hard delete is never allowed', () => {
  assert.throws(() => assertNoHardDelete('delete'), /hard/i);
  assert.throws(() => assertNoHardDelete('DELETE_ROW'), /hard/i);
  assert.doesNotThrow(() => assertNoHardDelete('append'));
});
test('visibleRows hides soft-deleted rows but keeps them in the source', () => {
  const rows = [{ id: 1 }, { id: 2, deleted: true }];
  assert.deepEqual(visibleRows(rows), [{ id: 1 }]);
  assert.equal(rows.length, 2);
});
