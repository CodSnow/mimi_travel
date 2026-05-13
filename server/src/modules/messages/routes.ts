import { Router } from 'express';

import { PythonClient, PythonClientError } from '../../services/python-client.js';

export function createMessagesRouter(pythonClient: PythonClient): Router {
  const router = Router();

  router.get('/api/messages/conversations', async (req, res) => {
    try {
      const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
      if (!userId) return res.status(400).json({ error: 'userId is required' });
      const result = await pythonClient.listConversations(userId);
      return res.json(result);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.post('/api/messages/conversations/ensure-order', async (req, res) => {
    try {
      if (!req.body?.orderId) return res.status(400).json({ error: 'orderId is required' });
      const result = await pythonClient.ensureOrderConversation({ orderId: req.body.orderId });
      return res.status(201).json(result);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.get('/api/messages/conversations/:id', async (req, res) => {
    try {
      const operatorUserId =
        typeof req.query.operatorUserId === 'string' ? req.query.operatorUserId : undefined;
      if (!operatorUserId) return res.status(400).json({ error: 'operatorUserId is required' });
      const result = await pythonClient.getConversation(req.params.id, operatorUserId);
      return res.json(result);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.post('/api/messages/conversations/:id', async (req, res) => {
    try {
      if (!req.body?.senderUserId || !req.body?.content) {
        return res.status(400).json({ error: 'senderUserId and content are required' });
      }
      const message = await pythonClient.sendMessage(req.params.id, req.body);
      return res.status(201).json(message);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.post('/api/messages/read', async (req, res) => {
    try {
      if (!req.body?.conversationId || !req.body?.userId) {
        return res.status(400).json({ error: 'conversationId and userId are required' });
      }
      const result = await pythonClient.markMessageRead(req.body);
      return res.json(result);
    } catch (error) {
      return handlePythonError(error, res);
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
  return res.status(500).json({ error: 'unexpected message error' });
}
