import { Router, type Response } from 'express';

import { PythonClient, PythonClientError } from '../../services/python-client.js';

export function createDemandsRouter(pythonClient: PythonClient): Router {
  const router = Router();

  router.post('/api/demands', async (req, res) => {
    const body = req.body || {};
    if (!body.serviceType || !body.title) {
      return res.status(400).json({ error: 'serviceType and title are required' });
    }

    try {
      const demand = await pythonClient.createDemand(normalizeDemandCreate(body));
      return res.status(201).json(demand);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.get('/api/demands', async (req, res) => {
    try {
      const result = await pythonClient.listDemands({
        serviceType: asString(req.query.serviceType),
        district: asString(req.query.district),
        status: asString(req.query.status),
        page: asString(req.query.page),
        pageSize: asString(req.query.pageSize),
      });
      return res.json(result);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.get('/api/demands/:id', async (req, res) => {
    try {
      const demand = await pythonClient.getDemand(req.params.id);
      return res.json(demand);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.post('/api/demands/:id/cancel', async (req, res) => {
    try {
      const operatorUserId = req.body?.operatorUserId;
      if (!operatorUserId) return res.status(400).json({ error: 'operatorUserId is required' });
      const demand = await pythonClient.cancelDemand(req.params.id, { operatorUserId });
      return res.json(demand);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  return router;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function normalizeDemandCreate(body: any) {
  return {
    ...body,
    userId: body.userId || body.user_id,
    budgetMinFen: body.budgetMinFen ?? body.budgetMin,
    budgetMaxFen: body.budgetMaxFen ?? body.budgetMax,
    expectedPriceFen: body.expectedPriceFen ?? body.expectedPrice,
    district: body.district ?? body.pickup?.district,
  };
}

function handlePythonError(error: unknown, res: Response) {
  if (error instanceof PythonClientError) {
    return res.status(error.statusCode).json({
      error: pythonErrorMessage(error, 'unexpected demand error'),
      details: error.details,
    });
  }
  return res.status(500).json({ error: 'unexpected demand error' });
}

function pythonErrorMessage(error: PythonClientError, fallback: string): string {
  const details = error.details as { detail?: unknown } | undefined;
  return typeof details?.detail === 'string' ? details.detail : fallback;
}
