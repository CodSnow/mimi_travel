import type { CareRequirements, RideRequirements, ServiceType } from '@mimi/shared';

import type { InternalRequestMeta } from './common.js';

export interface PricingQuoteRequest {
  meta: InternalRequestMeta;
  demand: {
    serviceType: ServiceType;
    district?: string;
    budgetMin?: number;
    budgetMax?: number;
    careRequirements?: CareRequirements;
    rideRequirements?: RideRequirements;
  };
  provider?: {
    providerUserId: string;
    vehicleId?: string;
  };
}

export interface PricingBreakdown {
  code: string;
  label: string;
  amountFen: number;
}

export interface PricingQuoteResponse {
  requestId: string;
  amountFen: number;
  breakdown: PricingBreakdown[];
}
