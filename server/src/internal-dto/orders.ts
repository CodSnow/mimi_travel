import type { CaregiverSnapshot, DriverSnapshot } from '@mimi/shared';

import type { InternalRequestMeta } from './common.js';

export interface OrderSnapshotRequest {
  meta: InternalRequestMeta;
  orderId: string;
  providerUserId: string;
  vehicleId?: string;
}

export interface OrderSnapshotResponse {
  requestId: string;
  orderId: string;
  caregiverSnapshot?: CaregiverSnapshot;
  driverSnapshot?: DriverSnapshot;
}
