import type { Response } from 'express';

import { DomainStoreError } from '../services/domain-store.js';

export function handleDomainError(error: unknown, res: Response, fallbackMessage: string) {
  if (error instanceof DomainStoreError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  return res.status(500).json({ error: fallbackMessage });
}
