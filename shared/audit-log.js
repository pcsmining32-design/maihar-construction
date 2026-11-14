// Audit + soft-delete helpers. Historical rows are NEVER hard-deleted.
export function buildAuditEntry({ user, project = '', action, entity, id = '', before = null, after = null, now = new Date() }) {
  if (!user) throw new Error('user is required');
  if (!action) throw new Error('action is required');
  if (!entity) throw new Error('entity is required');
  return { ts: now.toISOString(), user, project, action, entity, id, before, after };
}

export function softDelete({ user, project = '', entity, id, confirmed, reason, now = new Date() }) {
  if (confirmed !== true) throw new Error('Explicit confirmation is required to delete');
  if (!reason || !String(reason).trim()) throw new Error('A reason is required to delete');
  const patch = { deleted: true, deletedBy: user, deletedAt: now.toISOString(), deleteReason: String(reason).trim() };
  return { patch, audit: buildAuditEntry({ user, project, action: 'soft-delete', entity, id, after: patch, now }) };
}

export function assertNoHardDelete(action) {
  if (/delete/i.test(String(action))) throw new Error('Hard delete is not allowed; use soft delete');
}

export const visibleRows = rows => rows.filter(r => r.deleted !== true);
