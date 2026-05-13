import type { LocationPoint } from './location.js';

export type OfferStatus = 'submitted' | 'accepted' | 'rejected' | 'withdrawn';
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'confirmed'
  | 'arriving'
  | 'serving'
  | 'completed'
  | 'cancelled'
  | 'refund_pending'
  | 'refunded';

export interface Offer {
  id: string;
  demandId: string;
  providerUserId: string;
  quoteAmountFen: number;
  message?: string;
  etaMinutes?: number;
  vehicleId?: string;
  servicePlan?: string;
  status: OfferStatus;
  createdAt: string;
}

export interface DriverSnapshot {
  userId: string;
  nickname: string;
  avatar: string;
  petFriendlyScore?: number;
  tags: string[];
  vehicleType?: string;
}

export interface CaregiverSnapshot {
  userId: string;
  nickname: string;
  avatar: string;
  catCareScore?: number;
  tags: string[];
  supportsMedication?: boolean;
  supportsMultiDayCare?: boolean;
}

export interface ServiceOrder {
  id: string;
  demandId: string;
  buyerUserId: string;
  sellerUserId: string;
  title: string;
  amountFen: number;
  depositFen?: number;
  status: OrderStatus;
  serviceTime: string;
  pickup?: LocationPoint;
  destination?: LocationPoint;
  vehicleId?: string;
  driverSnapshot?: DriverSnapshot;
  caregiverSnapshot?: CaregiverSnapshot;
  createdAt: string;
  updatedAt: string;
}

export interface OrderEvent {
  id: string;
  orderId: string;
  eventType: string;
  operatorUserId?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}
