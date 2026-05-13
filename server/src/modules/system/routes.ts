import { Router } from 'express';

export function createSystemRouter(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return router;
}
