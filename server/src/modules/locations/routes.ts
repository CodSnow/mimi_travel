import { Router } from 'express';

import { DomainStore } from '../../services/domain-store.js';
import { handleDomainError } from '../../utils/domain-errors.js';

export function createLocationsRouter(domainStore: DomainStore): Router {
  const router = Router();

  router.post('/api/locations/report', async (req, res) => {
    const body = req.body || {};
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'valid lat and lng are required' });
    }

    try {
      const snapshot = await domainStore.reportLocation({ ...body, lat, lng });
      return res.status(201).json(snapshot);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected location error');
    }
  });

  router.get('/api/locations/nearby-providers', async (req, res) => {
    try {
      const items = await domainStore.nearbyProviders({
        lat: req.query.lat === undefined ? undefined : Number(req.query.lat),
        lng: req.query.lng === undefined ? undefined : Number(req.query.lng),
        district: typeof req.query.district === 'string' ? req.query.district : undefined,
        radiusKm: req.query.radiusKm === undefined ? undefined : Number(req.query.radiusKm),
        serviceType: typeof req.query.serviceType === 'string' ? req.query.serviceType : undefined,
      });
      return res.json({ items });
    } catch (error) {
      return handleDomainError(error, res, 'unexpected location error');
    }
  });

  return router;
}
