import { Router } from 'express';

import { NavigationService } from '../../services/navigation-service.js';

export function createNavigationRouter(navigationService: NavigationService): Router {
  const router = Router();

  router.get('/api/navigation/sdk-config', (_req, res) => {
    return res.json(navigationService.getSdkConfig());
  });

  router.get('/api/navigation/link', (req, res) => {
    const fromLat = Number(req.query.fromLat);
    const fromLng = Number(req.query.fromLng);
    const toLat = Number(req.query.toLat);
    const toLng = Number(req.query.toLng);
    const toName = String(req.query.toName || '');
    const mode = req.query.mode === 'walking' ? 'walking' : 'driving';

    if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite) || !toName) {
      return res.status(400).json({ error: 'invalid navigation params' });
    }

    return res.json(
      navigationService.buildLink({
        fromLat,
        fromLng,
        toLat,
        toLng,
        toName,
        mode,
      }),
    );
  });

  return router;
}
