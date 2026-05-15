import { Router } from 'express';

import { getLastPythonUser } from '../auth/routes.js';
import { DomainStore } from '../../services/domain-store.js';
import { PythonClient, PythonClientError } from '../../services/python-client.js';
import { handleDomainError } from '../../utils/domain-errors.js';

export function createReviewsRouter(domainStore: DomainStore, pythonClient: PythonClient): Router {
  const router = Router();

  router.post('/api/orders/:id/reviews', async (req, res) => {
    const body = req.body || {};
    if (!body.revieweeUserId || body.overallScore === undefined) {
      return res.status(400).json({ error: 'revieweeUserId and overallScore are required' });
    }
    const operatorUserId = body.operatorUserId || getLastPythonUser()?.id;
    if (!operatorUserId) return res.status(400).json({ error: 'operatorUserId is required' });
    if (body.reviewerUserId && body.reviewerUserId !== operatorUserId) {
      return res.status(403).json({ error: 'reviewerUserId must match operatorUserId' });
    }
    const payload = { ...body, reviewerUserId: operatorUserId };

    try {
      const review = await pythonClient.createReview(req.params.id, payload);
      return res.status(201).json(review);
    } catch (error) {
      if (error instanceof PythonClientError && error.statusCode === 503) {
        try {
          const review = await domainStore.createReview(req.params.id, payload);
          return res.status(201).json(review);
        } catch (fallbackError) {
          return handleDomainError(fallbackError, res, 'unexpected review error');
        }
      }
      return handlePythonOrDomainError(error, res, 'unexpected review error');
    }
  });

  router.get('/api/providers/:userId/reviews', async (req, res) => {
    try {
      return res.json(await pythonClient.listProviderReviews(req.params.userId));
    } catch (error) {
      if (error instanceof PythonClientError && error.statusCode === 503) {
        try {
          const reviews = await domainStore.listReviewsForProvider(req.params.userId);
          return res.json({ items: reviews });
        } catch (fallbackError) {
          return handleDomainError(fallbackError, res, 'unexpected review error');
        }
      }
      return handlePythonOrDomainError(error, res, 'unexpected review error');
    }
  });

  router.post('/api/orders/:id/feedback', async (req, res) => {
    const body = req.body || {};
    const operatorUserId = body.operatorUserId || getLastPythonUser()?.id;
    if (!operatorUserId) return res.status(400).json({ error: 'operatorUserId is required' });
    if (body.providerUserId && body.providerUserId !== operatorUserId) {
      return res.status(403).json({ error: 'providerUserId must match operatorUserId' });
    }
    const payload = { ...body, operatorUserId, providerUserId: body.providerUserId || operatorUserId };
    try {
      const feedback = await pythonClient.createFeedback(req.params.id, payload);
      return res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof PythonClientError && error.statusCode === 503) {
        try {
          const order = await domainStore.getOrder(req.params.id);
          if (!order) return res.status(404).json({ error: 'order not found' });
          if (order.sellerUserId !== operatorUserId) {
            return res.status(403).json({ error: 'only order seller can submit feedback' });
          }
          const feedback = await domainStore.createFeedback(req.params.id, payload);
          return res.status(201).json(feedback);
        } catch (fallbackError) {
          return handleDomainError(fallbackError, res, 'unexpected feedback error');
        }
      }
      return handlePythonOrDomainError(error, res, 'unexpected feedback error');
    }
  });

  router.get('/api/orders/:id/feedback', async (req, res) => {
    try {
      return res.json(await pythonClient.listFeedback(req.params.id));
    } catch (error) {
      if (error instanceof PythonClientError && error.statusCode === 503) {
        try {
          const feedback = await domainStore.listFeedback(req.params.id);
          return res.json({ items: feedback });
        } catch (fallbackError) {
          return handleDomainError(fallbackError, res, 'unexpected feedback error');
        }
      }
      return handlePythonOrDomainError(error, res, 'unexpected feedback error');
    }
  });

  return router;
}

function handlePythonOrDomainError(error: unknown, res: import('express').Response, fallback: string) {
  if (error instanceof PythonClientError) {
    return res.status(error.statusCode).json({
      error: pythonErrorMessage(error),
      details: error.details,
    });
  }
  return handleDomainError(error, res, fallback);
}

function pythonErrorMessage(error: PythonClientError): string {
  const details = error.details as { detail?: unknown } | undefined;
  return typeof details?.detail === 'string' ? details.detail : error.message;
}
