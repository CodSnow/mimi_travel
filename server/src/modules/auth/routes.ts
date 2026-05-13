import { Router } from 'express';

import { DomainStore } from '../../services/domain-store.js';
import { PythonClient, PythonClientError } from '../../services/python-client.js';
import { handleDomainError } from '../../utils/domain-errors.js';

let lastPythonUser: Awaited<ReturnType<PythonClient['login']>>['user'] | null = null;

export function getLastPythonUser() {
  return lastPythonUser;
}

export function createAuthRouter(domainStore: DomainStore, pythonClient: PythonClient): Router {
  const router = Router();

  router.post('/api/auth/login', async (req, res) => {
    const body = req.body || {};
    try {
      const result = await pythonClient.login({
        phone: cleanString(body.phone) || '13800009999',
        nickname: cleanString(body.nickname) || '咪咪用户',
        avatar: cleanString(body.avatar) || '🐱',
      });
      lastPythonUser = result.user;
      return res.json({
        user: {
          ...result.user,
          avatar: result.user.avatar || '🐱',
        },
        session: {
          userId: result.user.id,
          token: result.session.token,
          issuedAt: new Date().toISOString(),
          expiresAt: result.session.expiresAt,
        },
      });
    } catch (error) {
      if (error instanceof PythonClientError && error.statusCode === 503) {
        try {
          const user = await domainStore.login(body);
          return res.json({ user, session: { userId: user.id, issuedAt: new Date().toISOString() } });
        } catch (fallbackError) {
          return handleDomainError(fallbackError, res, 'unexpected auth error');
        }
      }
      return handleDomainError(error, res, 'unexpected auth error');
    }
  });

  router.post('/api/auth/logout', (_req, res) => {
    return res.json({ ok: true });
  });

  router.get('/api/auth/me', async (_req, res) => {
    if (lastPythonUser) {
      return res.json({ user: { ...lastPythonUser, avatar: lastPythonUser.avatar || '🐱' } });
    }
    try {
      const user = await domainStore.getCurrentUser();
      return res.json({ user });
    } catch (error) {
      return handleDomainError(error, res, 'unexpected auth error');
    }
  });

  return router;
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
