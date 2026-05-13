import { Router } from 'express';

import { MimiEngine } from '../../engine.js';

export function createStateRouter(engine: MimiEngine): Router {
  const router = Router();

  router.get('/api/state', async (_req, res) => {
    try {
      const state = await engine.readDb();
      res.json(state);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/api/state', async (req, res) => {
    try {
      const nextState = await engine.writeDb(req.body);
      res.json(nextState);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
