import cors from 'cors';
import express from 'express';

import { MimiEngine } from './engine.js';
import { createAuthRouter } from './modules/auth/routes.js';
import { createDemandsRouter } from './modules/demands/routes.js';
import { createLocationsRouter } from './modules/locations/routes.js';
import { createMatchingRouter } from './modules/matching/routes.js';
import { createMessagesRouter } from './modules/messages/routes.js';
import { createNavigationRouter } from './modules/navigation/routes.js';
import { createOffersRouter } from './modules/offers/routes.js';
import { createOrdersRouter } from './modules/orders/routes.js';
import { createPaymentsRouter } from './modules/payments/routes.js';
import { createPolicyRouter } from './modules/policy/routes.js';
import { createPricingRouter } from './modules/pricing/routes.js';
import { createProvidersRouter } from './modules/providers/routes.js';
import { createReviewsRouter } from './modules/reviews/routes.js';
import { createStateRouter } from './modules/state/routes.js';
import { createSystemRouter } from './modules/system/routes.js';
import { createUsersRouter } from './modules/users/routes.js';
import { DomainStore } from './services/domain-store.js';
import { NavigationService } from './services/navigation-service.js';
import { PythonClient } from './services/python-client.js';

export function createApp(pythonServiceBaseUrl: string, internalApiToken: string) {
  const app = express();
  const engine = new MimiEngine();
  const pythonClient = new PythonClient(pythonServiceBaseUrl, internalApiToken);
  const navigationService = new NavigationService();
  const domainStore = new DomainStore();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  app.use(createSystemRouter());
  app.use(createStateRouter(engine));
  app.use(createPolicyRouter(engine));
  app.use(createAuthRouter(domainStore));
  app.use(createUsersRouter(domainStore));
  app.use(createDemandsRouter(pythonClient));
  app.use(createOffersRouter(pythonClient));
  app.use(createMatchingRouter(pythonClient));
  app.use(createProvidersRouter(pythonClient, domainStore));
  app.use(createPricingRouter(pythonClient));
  app.use(createPaymentsRouter(pythonClient, domainStore));
  app.use(createOrdersRouter(pythonClient, domainStore));
  app.use(createMessagesRouter(domainStore));
  app.use(createReviewsRouter(domainStore));
  app.use(createLocationsRouter(domainStore));
  app.use(createNavigationRouter(navigationService));

  return app;
}
