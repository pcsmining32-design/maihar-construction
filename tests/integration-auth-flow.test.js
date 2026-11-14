import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthFlow } from '../shell/login.js';
import { PROJECTS } from '../shell/project-registry.js';

// Fake Firebase (no network): login -> role fetch -> project select
function makeFlow({ users, roles }) {
  const calls = { fetch: [] };
  const flow = createAuthFlow({
    registry: PROJECTS,
    signIn: async (email, pw) => {
      if (users[email] !== pw) throw Object.assign(new Error('bad'), { code: 'auth/invalid-credential' });
      return { email };
    },
    fetchRoleDoc: async email => { calls.fetch.push(email); return roles[email] ?? null; },
  });
  return { flow, calls };
}
const users = { 'boss@x.com': 'pw1', 'op@x.com': 'pw2', 'nobody@x.com': 'pw3' };
const roles = { 'boss@x.com': { superadmin: true }, 'op@x.com': { projects: { flyash: 'operator' } } };

test('login (mixed-case email) -> role fetched by lowercase id -> project list', async () => {
  const { flow, calls } = makeFlow({ users, roles });
  const s = await flow.login(' Boss@X.com ', 'pw1');
  assert.equal(s.ok, true);
  assert.deepEqual(calls.fetch, ['boss@x.com']);
  assert.equal(s.projects.length, PROJECTS.length);
});
test('operator sees only their project', async () => {
  const { flow } = makeFlow({ users, roles });
  const s = await flow.login('op@x.com', 'pw2');
  assert.deepEqual(s.projects.map(p => p.id), ['flyash']);
});
test('wrong password -> bad-credentials, role doc never fetched', async () => {
  const { flow, calls } = makeFlow({ users, roles });
  assert.deepEqual(await flow.login('op@x.com', 'wrong'), { ok: false, reason: 'bad-credentials' });
  assert.equal(calls.fetch.length, 0);
});
test('valid login but no role doc -> no-access', async () => {
  const { flow } = makeFlow({ users, roles });
  assert.deepEqual(await flow.login('nobody@x.com', 'pw3'), { ok: false, reason: 'no-access' });
});
test('select project: permitted ok, other project denied', async () => {
  const { flow } = makeFlow({ users, roles });
  const s = await flow.login('op@x.com', 'pw2');
  assert.deepEqual(flow.selectProject(s, 'flyash'), { ok: true, project: 'flyash', role: 'operator' });
  assert.deepEqual(flow.selectProject(s, 'koira'), { ok: false, reason: 'forbidden' });
});
test('empty email/password rejected before calling Firebase', async () => {
  const { flow } = makeFlow({ users, roles });
  assert.deepEqual(await flow.login('', ''), { ok: false, reason: 'missing-input' });
});
