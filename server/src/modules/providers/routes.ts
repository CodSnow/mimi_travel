import { Router, type Response } from 'express';

import { DomainStore } from '../../services/domain-store.js';
import { PythonClient, PythonClientError } from '../../services/python-client.js';
import { handleDomainError } from '../../utils/domain-errors.js';
import { buildInternalRequestMeta } from '../../utils/request-meta.js';

export function createProvidersRouter(pythonClient: PythonClient, domainStore: DomainStore): Router {
  const router = Router();

  router.get('/api/providers/:userId/review-summary', async (req, res) => {
    try {
      const result = await pythonClient.providerReviewSummary({
        meta: buildInternalRequestMeta(
          typeof req.query.operatorUserId === 'string' ? req.query.operatorUserId : undefined,
        ),
        providerUserId: req.params.userId,
      });
      return res.json(result);
    } catch (error) {
      if (error instanceof PythonClientError && error.statusCode === 503) {
        try {
          return res.json(await domainStore.summarizeReviews(req.params.userId));
        } catch (fallbackError) {
          return handleDomainError(fallbackError, res, 'unexpected provider error');
        }
      }
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
  return res.status(500).json({ error: 'unexpected provider error' });
}
