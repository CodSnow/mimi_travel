import { Router } from 'express';

import { DomainStore } from '../../services/domain-store.js';
import { handleDomainError } from '../../utils/domain-errors.js';

export function createUsersRouter(domainStore: DomainStore): Router {
  const router = Router();

  router.get('/api/users/me', async (_req, res) => {
    try {
      const user = await domainStore.getCurrentUser();
      return res.json(user);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected user error');
    }
  });

  router.put('/api/users/me', async (req, res) => {
    try {
      const user = await domainStore.updateCurrentUser(req.body || {});
      return res.json(user);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected user error');
    }
  });

  router.get('/api/providers/:userId', async (req, res) => {
    try {
      const bundle = await domainStore.getProvider(req.params.userId);
      if (!bundle.provider) return res.status(404).json({ error: 'provider not found' });
      return res.json(bundle);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected provider error');
    }
  });

  router.get('/api/providers', async (req, res) => {
    try {
      const providers = await domainStore.listProviders({
        serviceType: typeof req.query.serviceType === 'string' ? req.query.serviceType : undefined,
        district: typeof req.query.district === 'string' ? req.query.district : undefined,
      });
      return res.json({ items: providers });
    } catch (error) {
      return handleDomainError(error, res, 'unexpected provider error');
    }
  });

  router.post('/api/providers/apply', async (req, res) => {
    try {
      const result = await domainStore.applyProvider(req.body || {});
      return res.status(201).json(result);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected provider error');
    }
  });

  router.put('/api/providers/me', async (req, res) => {
    try {
      const result = await domainStore.updateProvider(req.body || {});
      return res.json(result);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected provider error');
    }
  });

  return router;
}
