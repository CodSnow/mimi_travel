import { Router } from 'express';

import { DomainStore } from '../../services/domain-store.js';
import { handleDomainError } from '../../utils/domain-errors.js';

export function createMessagesRouter(domainStore: DomainStore): Router {
  const router = Router();

  router.get('/api/messages/conversations', async (_req, res) => {
    try {
      const conversations = await domainStore.listConversations();
      return res.json({ items: conversations });
    } catch (error) {
      return handleDomainError(error, res, 'unexpected message error');
    }
  });

  router.get('/api/messages/conversations/:id', async (req, res) => {
    try {
      const result = await domainStore.getConversation(req.params.id);
      return res.json(result);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected message error');
    }
  });

  router.post('/api/messages/conversations/:id', async (req, res) => {
    try {
      const message = await domainStore.sendMessage(req.params.id, req.body || {});
      return res.status(201).json(message);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected message error');
    }
  });

  router.post('/api/messages/read', (_req, res) => {
    return res.json({ ok: true, readAt: new Date().toISOString() });
  });

  return router;
}
