import type { Demand, Offer, OrderEvent, ServiceOrder } from '@mimi/shared';

export interface DemandCreateRequest {
  userId: string;
  serviceType: Demand['serviceType'];
  title: string;
  description?: string;
  petSummary?: string;
  petIds?: string[];
  petSnapshot?: Record<string, unknown>;
  budgetMinFen?: number;
  budgetMaxFen?: number;
  expectedPriceFen?: number;
  contactName?: string;
  contactPhone?: string;
  allowBargain?: boolean;
  visibilityRadiusKm?: number;
  district?: string;
  pickup?: Demand['pickup'];
  destination?: Demand['destination'];
  careRequirements?: Demand['careRequirements'];
  rideRequirements?: Demand['rideRequirements'];
  serviceTime?: string;
}

export type DemandResponse = Demand & {
  petIds?: string[];
  petSnapshot?: Record<string, unknown>;
  budgetMinFen?: number;
  budgetMaxFen?: number;
  expectedPriceFen?: number;
};

export interface DemandListResponse {
  items: DemandResponse[];
}

export interface DemandCancelRequest {
  operatorUserId: string;
}

export interface OfferCreateRequest {
  providerUserId: string;
  quoteAmountFen: number;
  message?: string;
  etaMinutes?: number;
  vehicleId?: string;
  servicePlan?: string;
}

export type OfferResponse = Offer;

export interface OfferListResponse {
  items: OfferResponse[];
}

export interface AcceptOfferRequest {
  operatorUserId: string;
}

export type OrderResponse = ServiceOrder & {
  petSnapshot?: Record<string, unknown>;
  paymentStatus?: string;
  refundStatus?: string;
  feedbackSummary?: Record<string, unknown>;
};

export interface AcceptOfferResponse {
  offer: OfferResponse;
  order: OrderResponse;
}

export type OrderEventResponse = OrderEvent;

export interface OrderListResponse {
  items: OrderResponse[];
}

export interface OrderDetailResponse {
  order: OrderResponse;
  events: OrderEventResponse[];
}

export interface OrderTransitionRequest {
  action: string;
  operatorUserId: string;
}
