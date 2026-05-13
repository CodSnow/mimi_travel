import { Router } from 'express';

import { DomainStore } from '../../services/domain-store.js';
import { handleDomainError } from '../../utils/domain-errors.js';

export function createDemandsRouter(domainStore: DomainStore): Router {
  const router = Router();

  router.post('/api/demands', async (req, res) => {
    const body = req.body || {};
    if (!body.serviceType || !body.title) {
      return res.status(400).json({ error: 'serviceType and title are required' });
    }

    try {
      const demand = await domainStore.createDemand(body);
      return res.status(201).json(demand);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected demand error');
    }
  });

  router.get('/api/demands', async (req, res) => {
    try {
      const demands = await domainStore.listDemands({
        serviceType: asString(req.query.serviceType),
        district: asString(req.query.district),
        status: asString(req.query.status),
        petFriendly: asString(req.query.petFriendly),
        supportsCrate: asString(req.query.supportsCrate),
        supportsMultiPet: asString(req.query.supportsMultiPet),
        supportsMedication: asString(req.query.supportsMedication),
        supportsHomeVisit: asString(req.query.supportsHomeVisit),
        supportsMultiDayCare: asString(req.query.supportsMultiDayCare),
        page: asString(req.query.page),
        pageSize: asString(req.query.pageSize),
      });
      return res.json({ items: demands });
    } catch (error) {
      return handleDomainError(error, res, 'unexpected demand error');
    }
  });

  router.get('/api/demands/:id', async (req, res) => {
    try {
      const demand = await domainStore.getDemand(req.params.id);
      if (!demand) return res.status(404).json({ error: 'demand not found' });
      return res.json(demand);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected demand error');
    }
  });

  router.post('/api/demands/:id/cancel', async (req, res) => {
    try {
      const demand = await domainStore.cancelDemand(req.params.id, req.body?.operatorUserId);
      return res.json(demand);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected demand error');
    }
  });

  return router;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
