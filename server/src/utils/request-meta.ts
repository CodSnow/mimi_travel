import { randomUUID } from 'node:crypto';

import type { InternalRequestMeta } from '../internal-dto/common.js';

export function buildInternalRequestMeta(operatorUserId?: string): InternalRequestMeta {
  return {
    requestId: randomUUID(),
    operatorUserId,
    source: 'ts-bff',
    timestamp: new Date().toISOString(),
  };
}
