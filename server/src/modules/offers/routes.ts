import { Router } from 'express';

import { DomainStore } from '../../services/domain-store.js';
import { handleDomainError } from '../../utils/domain-errors.js';

export function createOffersRouter(domainStore: DomainStore): Router {
  const router = Router();

  router.post('/api/demands/:id/offers', async (req, res) => {
    const body = req.body || {};
    if (body.quoteAmountFen === undefined) {
      return res.status(400).json({ error: 'quoteAmountFen is required' });
    }

    try {
      const offer = await domainStore.createOffer(req.params.id, body);
      return res.status(201).json(offer);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected offer error');
    }
  });

  router.get('/api/demands/:id/offers', async (req, res) => {
    try {
      const offers = await domainStore.listOffers(req.params.id);
      return res.json({ items: offers });
    } catch (error) {
      return handleDomainError(error, res, 'unexpected offer error');
    }
  });

  router.post('/api/offers/:id/accept', async (req, res) => {
    try {
      const result = await domainStore.acceptOffer(req.params.id, req.body?.operatorUserId);
      return res.json(result);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected offer error');
    }
  });

  router.post('/api/offers/:id/reject', async (req, res) => {
    try {
      const offer = await domainStore.updateOfferStatus(req.params.id, 'rejected');
      return res.json(offer);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected offer error');
    }
  });

  router.post('/api/offers/:id/withdraw', async (req, res) => {
    try {
      const offer = await domainStore.updateOfferStatus(req.params.id, 'withdrawn');
      return res.json(offer);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected offer error');
    }
  });

  return router;
}
