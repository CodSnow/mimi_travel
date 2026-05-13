import { Router } from 'express';

import type { DomainStore } from '../../services/domain-store.js';
import { PythonClient, PythonClientError } from '../../services/python-client.js';
import { handleDomainError } from '../../utils/domain-errors.js';

export function createLocationsRouter(pythonClient: PythonClient, domainStore: DomainStore): Router {
  const router = Router();

  router.post('/api/locations/report', async (req, res) => {
    const body = req.body || {};
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'valid lat and lng are required' });
    }

    try {
      if (!body.userId) return res.status(400).json({ error: 'userId is required' });
      const result = await pythonClient.reportLocation({ ...body, lat, lng });
      return res.status(201).json(result);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.get('/api/locations/orders/:orderId', async (req, res) => {
    try {
      const operatorUserId =
        typeof req.query.operatorUserId === 'string' ? req.query.operatorUserId : undefined;
      if (!operatorUserId) return res.status(400).json({ error: 'operatorUserId is required' });
      const result = await pythonClient.listOrderLocations(req.params.orderId, operatorUserId);
      return res.json(result);
    } catch (error) {
      return handlePythonError(error, res);
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

function handlePythonError(error: unknown, res: import('express').Response) {
  if (error instanceof PythonClientError) {
    const details = error.details as { detail?: unknown } | undefined;
    return res.status(error.statusCode).json({
      error: typeof details?.detail === 'string' ? details.detail : error.message,
      details: error.details,
    });
  }
  return res.status(500).json({ error: 'unexpected location error' });
}
