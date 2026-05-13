import { Router } from 'express';

import { DomainStore } from '../../services/domain-store.js';
import { handleDomainError } from '../../utils/domain-errors.js';

export function createAuthRouter(domainStore: DomainStore): Router {
  const router = Router();

  router.post('/api/auth/login', async (req, res) => {
    try {
      const user = await domainStore.login(req.body || {});
      return res.json({ user, session: { userId: user.id, issuedAt: new Date().toISOString() } });
    } catch (error) {
      return handleDomainError(error, res, 'unexpected auth error');
    }
  });

  router.post('/api/auth/logout', (_req, res) => {
    return res.json({ ok: true });
  });

  router.get('/api/auth/me', async (_req, res) => {
    try {
      const user = await domainStore.getCurrentUser();
      return res.json({ user });
    } catch (error) {
      return handleDomainError(error, res, 'unexpected auth error');
    }
  });

  return router;
}
