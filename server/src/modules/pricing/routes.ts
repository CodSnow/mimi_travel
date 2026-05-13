import { Router, type Response } from 'express';

import type { PricingQuoteRequest } from '../../internal-dto/pricing.js';
import { PythonClient, PythonClientError } from '../../services/python-client.js';
import { buildInternalRequestMeta } from '../../utils/request-meta.js';

export function createPricingRouter(pythonClient: PythonClient): Router {
  const router = Router();

  router.post('/api/pricing/quote', async (req, res) => {
    const body = req.body as Omit<PricingQuoteRequest, 'meta'> & { operatorUserId?: string };
    if (!body?.demand) {
      return res.status(400).json({ error: 'demand is required' });
    }

    try {
      const result = await pythonClient.quote({
        ...body,
        meta: buildInternalRequestMeta(body.operatorUserId),
      });
      return res.json(result);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  return router;
}

function handlePythonError(error: unknown, res: Response) {
  if (error instanceof PythonClientError) {
    return res.status(error.statusCode).json({
      error: error.message,
      details: error.details,
    });
  }
  return res.status(500).json({ error: 'unexpected pricing error' });
}
