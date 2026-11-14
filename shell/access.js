// Pure permission logic (no Firebase). Firestore holds PERMISSIONS ONLY: userRoles/{email}.
const ROLES = ['admin', 'operator'];

export const normalizeEmail = e => (typeof e === 'string' ? e.trim().toLowerCase() : '');

export function accessibleProjects(roleDoc, registry) {
  if (!roleDoc || typeof roleDoc !== 'object') return [];
  if (roleDoc.superadmin === true) return registry.map(p => ({ ...p, role: 'admin' }));
  const mine = roleDoc.projects && typeof roleDoc.projects === 'object' ? roleDoc.projects : {};
  return registry
    .filter(p => ROLES.includes(mine[p.id]))
    .map(p => ({ ...p, role: mine[p.id] }));
}

export function resolveAccess(roleDoc, projectId, registry) {
  const hit = accessibleProjects(roleDoc, registry).find(p => p.id === projectId);
  return hit ? { allowed: true, role: hit.role } : { allowed: false, role: null };
}

// Master tab is edited ONLY via admin-only Vendor/Truck Master module.
export const canManageMaster = (roleDoc, projectId, registry) =>
  resolveAccess(roleDoc, projectId, registry).role === 'admin';
