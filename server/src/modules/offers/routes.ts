import { Router, type Response } from 'express';

import { PythonClient, PythonClientError } from '../../services/python-client.js';

export function createOffersRouter(pythonClient: PythonClient): Router {
  const router = Router();

  router.post('/api/demands/:id/offers', async (req, res) => {
    const body = req.body || {};
    if (body.quoteAmountFen === undefined) {
      return res.status(400).json({ error: 'quoteAmountFen is required' });
    }

    try {
      const offer = await pythonClient.createOffer(req.params.id, normalizeOfferCreate(body));
      return res.status(201).json(offer);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.get('/api/demands/:id/offers', async (req, res) => {
    try {
      const result = await pythonClient.listOffers(req.params.id);
      return res.json(result);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.post('/api/offers/:id/accept', async (req, res) => {
    try {
      const operatorUserId = req.body?.operatorUserId;
      if (!operatorUserId) return res.status(400).json({ error: 'operatorUserId is required' });
      const result = await pythonClient.acceptOffer(req.params.id, { operatorUserId });
      return res.json(result);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.post('/api/offers/:id/reject', async (req, res) => {
    try {
      const offer = await pythonClient.rejectOffer(req.params.id);
      return res.json(offer);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.post('/api/offers/:id/withdraw', async (req, res) => {
    try {
      const offer = await pythonClient.withdrawOffer(req.params.id);
      return res.json(offer);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  return router;
}

function normalizeOfferCreate(body: any) {
  return {
    ...body,
    providerUserId: body.providerUserId || body.provider_user_id,
    quoteAmountFen: body.quoteAmountFen ?? body.quote_amount_fen,
  };
}

function handlePythonError(error: unknown, res: Response) {
  if (error instanceof PythonClientError) {
    return res.status(error.statusCode).json({
      error: pythonErrorMessage(error, 'unexpected offer error'),
      details: error.details,
    });
  }
  return res.status(500).json({ error: 'unexpected offer error' });
}

function pythonErrorMessage(error: PythonClientError, fallback: string): string {
  const details = error.details as { detail?: unknown } | undefined;
  return typeof details?.detail === 'string' ? details.detail : fallback;
}
