import { Router } from 'express';

import { DomainStore } from '../../services/domain-store.js';
import { handleDomainError } from '../../utils/domain-errors.js';

export function createReviewsRouter(domainStore: DomainStore): Router {
  const router = Router();

  router.post('/api/orders/:id/reviews', async (req, res) => {
    const body = req.body || {};
    if (!body.revieweeUserId || body.overallScore === undefined) {
      return res.status(400).json({ error: 'revieweeUserId and overallScore are required' });
    }

    try {
      const review = await domainStore.createReview(req.params.id, body);
      return res.status(201).json(review);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected review error');
    }
  });

  router.get('/api/providers/:userId/reviews', async (req, res) => {
    try {
      const reviews = await domainStore.listReviewsForProvider(req.params.userId);
      return res.json({ items: reviews });
    } catch (error) {
      return handleDomainError(error, res, 'unexpected review error');
    }
  });

  router.post('/api/orders/:id/feedback', async (req, res) => {
    try {
      const feedback = await domainStore.createFeedback(req.params.id, req.body || {});
      return res.status(201).json(feedback);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected feedback error');
    }
  });

  router.get('/api/orders/:id/feedback', async (req, res) => {
    try {
      const feedback = await domainStore.listFeedback(req.params.id);
      return res.json({ items: feedback });
    } catch (error) {
      return handleDomainError(error, res, 'unexpected feedback error');
    }
  });

  return router;
}
