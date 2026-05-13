import type { PaymentChannel, PaymentScene, RiskLevel } from '@mimi/shared';

import type { InternalRequestMeta } from './common.js';

export interface PrepayRiskCheckRequest {
  meta: InternalRequestMeta;
  order: {
    id: string;
    buyerUserId: string;
    sellerUserId: string;
    amountFen: number;
    serviceType: string;
    district?: string;
  };
  payment: {
    channel: PaymentChannel;
    scene: PaymentScene;
  };
}

export interface PrepayRiskCheckResponse {
  requestId: string;
  allowed: boolean;
  riskLevel: RiskLevel;
  reasonCodes: string[];
  humanMessage?: string;
}
