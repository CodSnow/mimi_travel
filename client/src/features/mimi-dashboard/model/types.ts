import type { ServiceOrder, ServiceType } from '@mimi/shared';

export type TabKey = 'home' | 'publish' | 'orders' | 'messages' | 'policy' | 'mine';

export type ScreenKey =
  | 'tab'
  | 'nearby_providers'
  | 'demand_hall'
  | 'demand_detail'
  | 'provider_detail'
  | 'driver_detail'
  | 'order_confirm'
  | 'payment_confirm'
  | 'payment_result'
  | 'order_detail'
  | 'navigation'
  | 'care_feedback'
  | 'conversation'
  | 'policy_detail'
  | 'pets'
  | 'addresses'
  | 'favorites'
  | 'payments'
  | 'refund'
  | 'dispute'
  | 'provider_onboarding'
  | 'provider_workspace'
  | 'offer_management'
  | 'admin';

export interface ScreenParams {
  demandId?: string;
  providerUserId?: string;
  orderId?: string;
  conversationId?: string;
  policyId?: string;
}

export type OrderTone = 'warm' | 'blue' | 'green' | 'gray' | 'danger';

export type OrderFilterKey = 'all' | 'pending' | 'processing' | 'completed' | 'after_sale';

export interface TabItem {
  key: TabKey;
  label: string;
  icon: string;
}

export interface ServiceTypeOption {
  value: ServiceType;
  label: string;
  icon: string;
  note: string;
}

export interface ProviderCard {
  userId: string;
  nickname: string;
  avatar: string;
  intro: string;
  baseDistrict: string;
  score: number;
  reviewCount: number;
  completedOrderCount: number;
  services: ServiceType[];
  tags: string[];
  vehicleId?: string;
  vehicleType?: string;
}

export interface RecommendationCard {
  providerUserId: string;
  nickname: string;
  avatar: string;
  score: number;
  distanceKm?: number;
  etaMinutes?: number;
  reasons: string[];
  priceHintFen: number;
  tags: string[];
  reviewCount: number;
  vehicleId?: string;
  serviceNote: string;
}

export interface DemandFormState {
  serviceType: ServiceType;
  title: string;
  description: string;
  petSummary: string;
  district: string;
  pickupAddress: string;
  destinationAddress: string;
  budgetMinYuan: number;
  budgetMaxYuan: number;
  serviceTime: string;
  allowBargain: boolean;
  visibilityRadiusKm: number;
  needHomeVisit: boolean;
  needMedication: boolean;
  needMultiDayCare: boolean;
  needPhotoFeedback: boolean;
  petCount: number;
  carrierType: 'none' | 'cat_bag' | 'crate' | 'stroller';
  requirePetFriendlyVehicle: boolean;
  requireLargeTrunk: boolean;
  requireStableDriving: boolean;
  requireLowOdor: boolean;
}

export interface ReviewDraft {
  score: number;
  content: string;
}

export interface ProfileDraft {
  nickname: string;
  phone: string;
  avatar: string;
}

export interface LoginDraft {
  nickname: string;
  phone: string;
  avatar: string;
}

export interface OrderFilterItem {
  key: OrderFilterKey;
  label: string;
}

export interface OrderStatusItem {
  label: string;
  tone: OrderTone;
  desc: string;
}

export type OrderStatusMap = Record<ServiceOrder['status'], OrderStatusItem>;
