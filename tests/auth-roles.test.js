import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmail, accessibleProjects, resolveAccess, canManageMaster } from '../shell/access.js';
import { PROJECTS } from '../shell/project-registry.js';

const staff = { superadmin: false, projects: { flyash: 'operator', hopper63: 'admin', ghost: 'admin', koira: 'owner' } };

test('email is normalised (trim + lowercase) for doc id lookup', () => {
  assert.equal(normalizeEmail('  PCS@Gmail.COM '), 'pcs@gmail.com');
  assert.equal(normalizeEmail(null), '');
});
test('superadmin gets ALL registry projects as admin', () => {
  const list = accessibleProjects({ superadmin: true }, PROJECTS);
  assert.deepEqual(list.map(p => p.id), PROJECTS.map(p => p.id));
  assert.ok(list.every(p => p.role === 'admin'));
});
test('staff sees only their own projects with their own role', () => {
  const list = accessibleProjects(staff, PROJECTS);
  assert.deepEqual(list.map(p => [p.id, p.role]), [['flyash', 'operator'], ['hopper63', 'admin']]);
});
test('invalid role value (owner) and unknown project (ghost) are ignored', () => {
  const ids = accessibleProjects(staff, PROJECTS).map(p => p.id);
  assert.ok(!ids.includes('koira'));
  assert.ok(!ids.includes('ghost'));
});
test('no role doc / empty doc = no access', () => {
  assert.deepEqual(accessibleProjects(null, PROJECTS), []);
  assert.deepEqual(accessibleProjects({}, PROJECTS), []);
});
test('resolveAccess: allowed, denied, unknown project', () => {
  assert.deepEqual(resolveAccess(staff, 'flyash', PROJECTS), { allowed: true, role: 'operator' });
  assert.deepEqual(resolveAccess(staff, 'mira-mundly', PROJECTS), { allowed: false, role: null });
  assert.deepEqual(resolveAccess({ superadmin: true }, 'nope', PROJECTS), { allowed: false, role: null });
});
test('only admin can manage Master (Vendor/Truck Master); operator cannot', () => {
  assert.equal(canManageMaster(staff, 'hopper63', PROJECTS), true);
  assert.equal(canManageMaster(staff, 'flyash', PROJECTS), false);
  assert.equal(canManageMaster({ superadmin: true }, 'koira', PROJECTS), true);
  assert.equal(canManageMaster(null, 'koira', PROJECTS), false);
});
test('superadmin must be exactly true (string "true" is not enough)', () => {
  assert.deepEqual(accessibleProjects({ superadmin: 'true' }, PROJECTS), []);
});
