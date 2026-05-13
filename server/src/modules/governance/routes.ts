import { Router, type Response } from 'express';

import { PythonClient, PythonClientError } from '../../services/python-client.js';

export function createGovernanceRouter(pythonClient: PythonClient): Router {
  const router = Router();

  router.get('/api/admin/dashboard', async (req, res) => {
    const adminUserId = typeof req.query.adminUserId === 'string' ? req.query.adminUserId : undefined;
    if (!adminUserId) return res.status(400).json({ error: 'adminUserId is required' });
    try {
      return res.json(await pythonClient.adminDashboard(adminUserId));
    } catch (error) {
      return handlePythonError(error, res, 'unexpected governance error');
    }
  });

  router.post('/api/admin/provider-applications/:id/review', async (req, res) => {
    try {
      return res.json(await pythonClient.reviewProviderApplication(req.params.id, req.body || {}));
    } catch (error) {
      return handlePythonError(error, res, 'unexpected provider application error');
    }
  });

  router.post('/api/complaints', async (req, res) => {
    try {
      return res.status(201).json(await pythonClient.createComplaint(req.body || {}));
    } catch (error) {
      return handlePythonError(error, res, 'unexpected complaint error');
    }
  });

  router.post('/api/admin/complaints/:id/handle', async (req, res) => {
    try {
      return res.json(await pythonClient.handleComplaint(req.params.id, req.body || {}));
    } catch (error) {
      return handlePythonError(error, res, 'unexpected complaint error');
    }
  });

  router.post('/api/disputes', async (req, res) => {
    try {
      return res.status(201).json(await pythonClient.createDispute(req.body || {}));
    } catch (error) {
      return handlePythonError(error, res, 'unexpected dispute error');
    }
  });

  router.post('/api/admin/disputes/:id/handle', async (req, res) => {
    try {
      return res.json(await pythonClient.handleDispute(req.params.id, req.body || {}));
    } catch (error) {
      return handlePythonError(error, res, 'unexpected dispute error');
    }
  });

  router.get('/api/policy-favorites', async (req, res) => {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    try {
      return res.json(await pythonClient.listPolicyFavorites(userId));
    } catch (error) {
      return handlePythonError(error, res, 'unexpected policy favorite error');
    }
  });

  router.post('/api/policy-favorites', async (req, res) => {
    try {
      return res.status(201).json(await pythonClient.createPolicyFavorite(req.body || {}));
    } catch (error) {
      return handlePythonError(error, res, 'unexpected policy favorite error');
    }
  });

  return router;
}

function handlePythonError(error: unknown, res: Response, fallback: string) {
  if (error instanceof PythonClientError) {
    const details = error.details as { detail?: unknown } | undefined;
    return res.status(error.statusCode).json({
      error: typeof details?.detail === 'string' ? details.detail : error.message,
      details: error.details,
    });
  }
  return res.status(500).json({ error: fallback });
}
