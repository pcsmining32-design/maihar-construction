// Login flow with injected Firebase adapters, so it is testable without network.
import { normalizeEmail, accessibleProjects, resolveAccess } from './access.js';

export function createAuthFlow({ signIn, fetchRoleDoc, registry }) {
  return {
    async login(emailInput, password) {
      const email = normalizeEmail(emailInput);
      if (!email || !password) return { ok: false, reason: 'missing-input' };
      try { await signIn(email, password); }
      catch { return { ok: false, reason: 'bad-credentials' }; }
      const roleDoc = await fetchRoleDoc(email);
      const projects = accessibleProjects(roleDoc, registry);
      if (!projects.length) return { ok: false, reason: 'no-access' };
      return { ok: true, email, roleDoc, superadmin: roleDoc.superadmin === true, projects };
    },
    selectProject(session, projectId) {
      const r = resolveAccess(session && session.roleDoc, projectId, registry);
      return r.allowed ? { ok: true, project: projectId, role: r.role } : { ok: false, reason: 'forbidden' };
    },
  };
}
