import type { LocationSnapshot } from '@mimi/shared';

export interface LocationReportRequest {
  userId: string;
  orderId?: string;
  lat: number;
  lng: number;
  address?: string;
  coordSystem?: LocationSnapshot['coordSystem'];
}

export type LocationResponse = LocationSnapshot;

export interface LocationReportResponse {
  snapshot: LocationResponse;
  messageId?: string;
}

export interface LocationListResponse {
  items: LocationResponse[];
}
