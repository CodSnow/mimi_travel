import { Router, type Response } from 'express';

import type { OrderSnapshotRequest } from '../../internal-dto/orders.js';
import { DomainStore } from '../../services/domain-store.js';
import { PythonClient, PythonClientError } from '../../services/python-client.js';
import { handleDomainError } from '../../utils/domain-errors.js';
import { buildInternalRequestMeta } from '../../utils/request-meta.js';

export function createOrdersRouter(pythonClient: PythonClient, domainStore: DomainStore): Router {
  const router = Router();

  router.get('/api/orders', async (req, res) => {
    try {
      const orders = await domainStore.listOrders({
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
      });
      return res.json({ items: orders });
    } catch (error) {
      return handleDomainError(error, res, 'unexpected order error');
    }
  });

  router.get('/api/orders/:id', async (req, res) => {
    try {
      const order = await domainStore.getOrder(req.params.id);
      if (!order) return res.status(404).json({ error: 'order not found' });
      const events = await domainStore.listOrderEvents(order.id);
      return res.json({ order, events });
    } catch (error) {
      return handleDomainError(error, res, 'unexpected order error');
    }
  });

  router.post('/api/orders/:id/confirm-arrival', async (req, res) => {
    return transitionOrder(req.params.id, 'confirm-arrival', req.body?.operatorUserId, domainStore, res);
  });

  router.post('/api/orders/:id/start-service', async (req, res) => {
    return transitionOrder(req.params.id, 'start-service', req.body?.operatorUserId, domainStore, res);
  });

  router.post('/api/orders/:id/complete', async (req, res) => {
    return transitionOrder(req.params.id, 'complete', req.body?.operatorUserId, domainStore, res);
  });

  router.post('/api/orders/:id/cancel', async (req, res) => {
    return transitionOrder(req.params.id, 'cancel', req.body?.operatorUserId, domainStore, res);
  });

  router.post('/api/orders/snapshot', async (req, res) => {
    const body = req.body as Omit<OrderSnapshotRequest, 'meta'> & { operatorUserId?: string };
    if (!body?.orderId || !body?.providerUserId) {
      return res.status(400).json({ error: 'orderId and providerUserId are required' });
    }

    try {
      const result = await pythonClient.orderSnapshot({
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

async function transitionOrder(
  orderId: string,
  action: 'confirm-arrival' | 'start-service' | 'complete' | 'cancel',
  operatorUserId: string | undefined,
  domainStore: DomainStore,
  res: Response,
) {
  try {
    const order = await domainStore.transitionOrder(orderId, action, operatorUserId);
    return res.json(order);
  } catch (error) {
    return handleDomainError(error, res, 'unexpected order error');
  }
}

function handlePythonError(error: unknown, res: Response) {
  if (error instanceof PythonClientError) {
    return res.status(error.statusCode).json({
      error: error.message,
      details: error.details,
    });
  }
  return res.status(500).json({ error: 'unexpected order error' });
}
